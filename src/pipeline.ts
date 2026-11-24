import {
  Matrix3, Matrix4, MeshBasicNodeMaterial, NearestFilter, PerspectiveCamera, QuadMesh, RenderTarget, Vector3, Vector4,
} from 'three/webgpu'
import type { Scene, WebGPURenderer } from 'three/webgpu'
import { Fn, If, ivec2, screenCoordinate, textureLoad, uniform, vec2, vec3, vec4 } from 'three/tsl'
import {
  EAC_COLUMNS, equiangularCapture, equiangularSampler, OCTAHEDRAL_SIZE, octahedralDirection, octahedralSampler,
  PROJECTION_SOURCE_SIZE,
} from './advanced-projections'
import { createReferenceCamera, eyeOffset, FACES, FRAME, IMAGE, orientationFor } from './camera'
import type { LineOfSight } from './camera'
import { STEREOGRAPHIC_DISK_SIZE } from './projection-layout'
import type { Projection } from './projection-layout'
import { createProjectionReadback } from './projection-readback'
import { cubemapSampler, FACE_SIZE, panoramaDirection, PANORAMA, panoramaSampler } from './projections'
import { stereographicDirection, stereographicSampler } from './stereographic-projection'

type ShaderValue = ReturnType<typeof vec3>
export type StereoView = 'reprojected' | 'direct'
export type FrameRegion = [x: number, y: number, width: number, height: number]

interface RenderSettings {
  view: StereoView
  frames: [FrameRegion, FrameRegion]
  projection: Projection
  los: LineOfSight
  baseline: number
}

function target(width: number, height: number, depthBuffer = true) {
  return new RenderTarget(width, height, {
    depthBuffer,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
  })
}

function fullscreenMaterial() {
  return new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
}

function createEye() {
  const faces = FACES.map(() => target(FACE_SIZE, FACE_SIZE))
  const cube = cubemapSampler(faces.map(({ texture }) => texture))
  const panorama = target(PANORAMA.width, PANORAMA.height, false)
  const panoramaMaterial = fullscreenMaterial()
  panoramaMaterial.fragmentNode = cube(panoramaDirection(screenCoordinate.xy))
  const equiangular = target(FACE_SIZE * EAC_COLUMNS, FACE_SIZE * (FACES.length / EAC_COLUMNS), false)
  const octahedral = target(OCTAHEDRAL_SIZE, OCTAHEDRAL_SIZE, false)
  const stereographic = target(STEREOGRAPHIC_DISK_SIZE * 2, STEREOGRAPHIC_DISK_SIZE, false)
  return {
    faces,
    panorama,
    panoramaMaterial,
    equiangular,
    octahedral,
    stereographic,
    samplers: {
      cubemap: cube,
      equirectangular: panoramaSampler(panorama.texture),
      equiangular: equiangularSampler(equiangular.texture),
      octahedral: octahedralSampler(octahedral.texture),
      stereographic: stereographicSampler(stereographic.texture),
    },
    reference: target(IMAGE.width * 2, IMAGE.height * 2),
  }
}

export function createPipeline(renderer: WebGPURenderer) {
  const eyes = [createEye(), createEye()]
  const readProjection = createProjectionReadback(renderer, eyes.map(({ faces, panorama, equiangular, octahedral, stereographic }) => ({
    faces: faces.map(({ texture }) => texture),
    panorama: panorama.texture,
    equiangular: equiangular.texture,
    octahedral: octahedral.texture,
    stereographic: stereographic.texture,
  })))
  const quad = new QuadMesh()
  // Each eye is packed before reusing these intermediate render targets for the other eye.
  const sourceFaces = FACES.map(() => target(PROJECTION_SOURCE_SIZE, PROJECTION_SOURCE_SIZE))
  const sourceTextures = sourceFaces.map(({ texture }) => texture)
  const equiangularMaterial = fullscreenMaterial()
  equiangularMaterial.fragmentNode = equiangularCapture(sourceTextures)(screenCoordinate.xy)
  const octahedralMaterial = fullscreenMaterial()
  const sampleSource = cubemapSampler(sourceTextures, PROJECTION_SOURCE_SIZE)
  octahedralMaterial.fragmentNode = sampleSource(octahedralDirection(screenCoordinate.xy))
  const stereographicMaterial = fullscreenMaterial()
  stereographicMaterial.fragmentNode = sampleSource(stereographicDirection(screenCoordinate.xy))
  const packedMaterials = {
    equiangular: equiangularMaterial,
    octahedral: octahedralMaterial,
    stereographic: stereographicMaterial,
  }
  const faceCamera = new PerspectiveCamera(90, 1, 0.01, 10_000)
  const directCamera = createReferenceCamera()
  const center = new Vector3()
  const look = new Vector3()
  const rotationMatrix = new Matrix4()
  const viewRotation = uniform(new Matrix3())
  const frameRegions = [uniform(new Vector4()), uniform(new Vector4())]
  let captureScene: Scene | undefined
  let captureBaseline: number | undefined
  let captureRevision = 0
  const captured = new Set<Projection>()
  let directScene: Scene | undefined
  let directBaseline: number | undefined
  let directLos: LineOfSight | undefined

  function createComposite(mode: 'direct' | Projection) {
    const sampleEye = eyes.map((eye) => Fn<[ShaderValue]>(([pixel]) => {
      if (mode === 'direct') {
        const first = ivec2(pixel.mul(2))
        const reference = eye.reference.texture
        return textureLoad(reference, first)
          .add(textureLoad(reference, first.add(ivec2(1, 0))))
          .add(textureLoad(reference, first.add(ivec2(0, 1))))
          .add(textureLoad(reference, first.add(ivec2(1, 1)))).mul(0.25)
      }
      // Pixel centers use integer image coordinates and +Y points up in the camera.
      const ray = vec3(pixel.x.sub(IMAGE.cx).div(IMAGE.focal), pixel.y.negate().add(IMAGE.cy).div(IMAGE.focal), -1)
      return eye.samplers[mode](viewRotation.mul(ray).normalize())
    }))

    const material = fullscreenMaterial()
    material.fragmentNode = Fn(() => {
      const output = vec4(0).toVar()
      const frameSize = vec2(FRAME.width, FRAME.height)
      frameRegions.forEach((region, index) => {
        const native = screenCoordinate.xy.sub(region.xy).mul(frameSize).div(region.zw).floor().toVar()
        If(native.x.greaterThanEqual(0).and(native.x.lessThan(FRAME.width))
          .and(native.y.greaterThanEqual(0)).and(native.y.lessThan(FRAME.height)), () => {
          output.assign(vec4(0, 0, 0, 1))
          const pixel = native.sub(vec2(FRAME.x, FRAME.y)).toVar()
          If(pixel.x.greaterThanEqual(0).and(pixel.x.lessThan(IMAGE.width))
            .and(pixel.y.greaterThanEqual(0)).and(pixel.y.lessThan(IMAGE.height)), () => {
            output.assign(sampleEye[index](pixel))
          })
        })
      })
      return output
    })()
    return material
  }

  const composites = {
    direct: createComposite('direct'),
    cubemap: createComposite('cubemap'),
    equirectangular: createComposite('equirectangular'),
    equiangular: createComposite('equiangular'),
    octahedral: createComposite('octahedral'),
    stereographic: createComposite('stereographic'),
  }

  function captureFaces(scene: Scene, faces: RenderTarget[], index: number, baseline: number) {
    center.set(eyeOffset(index, baseline), 0, 0)
    faceCamera.position.copy(center)
    FACES.forEach(({ forward, up }, faceIndex) => {
      faceCamera.up.copy(up)
      faceCamera.lookAt(look.copy(center).add(forward))
      renderer.setRenderTarget(faces[faceIndex])
      renderer.render(scene, faceCamera)
    })
  }

  function captureProjection(scene: Scene, projection: Projection, baseline: number) {
    if (scene !== captureScene || baseline !== captureBaseline) {
      captured.clear()
      captureScene = scene
      captureBaseline = baseline
      captureRevision++
    }
    if (captured.has(projection)) return

    if (projection !== 'cubemap' && projection !== 'equirectangular') {
      eyes.forEach((eye, index) => {
        captureFaces(scene, sourceFaces, index, baseline)
        renderer.setRenderTarget(eye[projection])
        quad.material = packedMaterials[projection]
        quad.render(renderer)
      })
    } else {
      if (!captured.has('cubemap')) {
        eyes.forEach((eye, index) => captureFaces(scene, eye.faces, index, baseline))
        captured.add('cubemap')
      }
      if (projection === 'equirectangular') {
        eyes.forEach((eye) => {
          renderer.setRenderTarget(eye.panorama)
          quad.material = eye.panoramaMaterial
          quad.render(renderer)
        })
      }
    }
    captured.add(projection)
  }

  function draw(scene: Scene, { view, frames, projection, los, baseline }: RenderSettings) {
    const orientation = orientationFor(los)
    const direct = view === 'direct'
    if (!direct) {
      captureProjection(scene, projection, baseline)
      viewRotation.value.setFromMatrix4(rotationMatrix.makeRotationFromQuaternion(orientation))
    } else if (scene !== directScene || baseline !== directBaseline || los.yaw !== directLos?.yaw
      || los.pitch !== directLos.pitch || los.roll !== directLos.roll) {
      directCamera.quaternion.copy(orientation)
      eyes.forEach((eye, index) => {
        directCamera.position.set(eyeOffset(index, baseline), 0, 0)
        renderer.setRenderTarget(eye.reference)
        renderer.render(scene, directCamera)
      })
      directScene = scene
      directBaseline = baseline
      directLos = { ...los }
    }

    frames.forEach((frame, index) => frameRegions[index].value.set(...frame))
    renderer.setRenderTarget(null)
    quad.material = composites[direct ? 'direct' : projection]
    quad.render(renderer)
    return captureRevision
  }

  return { draw, readProjection }
}
