import {
  Matrix3, Matrix4, MeshBasicNodeMaterial, NearestFilter, PerspectiveCamera, QuadMesh, RenderTarget, Vector3,
} from 'three/webgpu'
import type { Scene, WebGPURenderer } from 'three/webgpu'
import { Fn, If, ivec2, screenCoordinate, textureLoad, uniform, vec2, vec3, vec4 } from 'three/tsl'
import { createReferenceCamera, FACES, FRAME, IMAGE, orientationFor } from './camera'
import type { LineOfSight } from './camera'
import type { Projection } from './projection-layout'
import { createProjectionReadback } from './projection-readback'
import { cubemapSampler, FACE_SIZE, panoramaDirection, PANORAMA, panoramaSampler } from './projections'

type ShaderValue = ReturnType<typeof vec3>

interface RenderSettings {
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

function createEye() {
  const faces = FACES.map(() => target(FACE_SIZE, FACE_SIZE))
  const cube = cubemapSampler(faces.map(({ texture }) => texture))
  const panorama = target(PANORAMA.width, PANORAMA.height, false)
  const panoramaMaterial = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
  panoramaMaterial.fragmentNode = cube(panoramaDirection(screenCoordinate.xy))
  return {
    faces,
    cube,
    panorama,
    panoramaMaterial,
    samplePanorama: panoramaSampler(panorama.texture),
    reference: target(IMAGE.width * 2, IMAGE.height * 2),
  }
}

export function createPipeline(renderer: WebGPURenderer) {
  const eyes = [createEye(), createEye()]
  const readProjection = createProjectionReadback(renderer, eyes.map(({ faces, panorama }) => ({
    faces: faces.map(({ texture }) => texture),
    panorama: panorama.texture,
  })))
  const quad = new QuadMesh()
  const composite = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
  const faceCamera = new PerspectiveCamera(90, 1, 0.01, 10_000)
  const directCamera = createReferenceCamera()
  const center = new Vector3()
  const look = new Vector3()
  const rotationMatrix = new Matrix4()
  const viewRotation = uniform(new Matrix3())
  const showPanorama = uniform(0)
  let captureScene: Scene | undefined
  let captureBaseline: number | undefined
  let captureRevision = 0
  let panoramaReady = false
  let previousLos: LineOfSight | undefined

  const sampleEye = eyes.map((eye) => Fn<[ShaderValue, ShaderValue]>(([pixel, isDirect]) => {
    const color = vec4(0, 0, 0, 1).toVar()
    If(isDirect, () => {
      const first = ivec2(pixel.mul(2))
      const reference = eye.reference.texture
      color.assign(textureLoad(reference, first)
        .add(textureLoad(reference, first.add(ivec2(1, 0))))
        .add(textureLoad(reference, first.add(ivec2(0, 1))))
        .add(textureLoad(reference, first.add(ivec2(1, 1)))).mul(0.25))
    }).Else(() => {
      // Pixel centers use integer image coordinates and +Y points up in the camera.
      const ray = vec3(pixel.x.sub(IMAGE.cx).div(IMAGE.focal), pixel.y.negate().add(IMAGE.cy).div(IMAGE.focal), -1)
      const direction = viewRotation.mul(ray).normalize().toVar()
      If(showPanorama.greaterThan(0.5), () => {
        color.assign(eye.samplePanorama(direction))
      }).Else(() => {
        color.assign(eye.cube(direction))
      })
    })
    return color
  }))

  composite.fragmentNode = Fn(() => {
    const output = vec4(0, 0, 0, 1).toVar()
    const screen = screenCoordinate.xy.floor()
    const pixel = screen.mod(vec2(FRAME.width, FRAME.height)).sub(vec2(FRAME.x, FRAME.y)).toVar()
    const isDirect = screen.x.greaterThanEqual(FRAME.width)

    If(pixel.x.greaterThanEqual(0).and(pixel.x.lessThan(IMAGE.width))
      .and(pixel.y.greaterThanEqual(0)).and(pixel.y.lessThan(IMAGE.height)), () => {
      If(screen.y.lessThan(FRAME.height), () => {
        output.assign(sampleEye[0](pixel, isDirect))
      }).Else(() => {
        output.assign(sampleEye[1](pixel, isDirect))
      })
    })

    return output
  })()

  renderer.setPixelRatio(1)
  renderer.setSize(FRAME.width * 2, FRAME.height * 2, false)

  function draw(scene: Scene, { projection, los, baseline }: RenderSettings) {
    const captureChanged = scene !== captureScene || baseline !== captureBaseline
    const viewChanged = captureChanged || los.yaw !== previousLos?.yaw
      || los.pitch !== previousLos.pitch || los.roll !== previousLos.roll

    if (captureChanged) {
      panoramaReady = false
      eyes.forEach((eye, index) => {
        center.set((index - 0.5) * baseline / 1000, 0, 0)
        faceCamera.position.copy(center)
        FACES.forEach(({ forward, up }, faceIndex) => {
          faceCamera.up.copy(up)
          faceCamera.lookAt(look.copy(center).add(forward))
          renderer.setRenderTarget(eye.faces[faceIndex])
          renderer.render(scene, faceCamera)
        })
      })
    }

    if (projection === 'equirectangular' && !panoramaReady) {
      eyes.forEach((eye) => {
        renderer.setRenderTarget(eye.panorama)
        quad.material = eye.panoramaMaterial
        quad.render(renderer)
      })
      panoramaReady = true
    }

    if (viewChanged) {
      const orientation = orientationFor(los)
      viewRotation.value.setFromMatrix4(rotationMatrix.makeRotationFromQuaternion(orientation))
      directCamera.quaternion.copy(orientation)
      eyes.forEach((eye, index) => {
        directCamera.position.set((index - 0.5) * baseline / 1000, 0, 0)
        renderer.setRenderTarget(eye.reference)
        renderer.render(scene, directCamera)
      })
    }

    showPanorama.value = projection === 'equirectangular' ? 1 : 0
    renderer.setRenderTarget(null)
    quad.material = composite
    quad.render(renderer)
    captureScene = scene
    captureBaseline = baseline
    previousLos = { ...los }
    if (captureChanged) captureRevision++
    return captureRevision
  }

  return { draw, readProjection }
}
