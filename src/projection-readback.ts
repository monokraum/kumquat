import { MeshBasicNodeMaterial, QuadMesh, RenderTarget } from 'three/webgpu'
import type { Texture, WebGPURenderer } from 'three/webgpu'
import { Fn, If, ivec2, screenCoordinate, sRGBTransferOETF, textureLoad, vec2, vec4 } from 'three/tsl'
import { EAC_COLUMNS, OCTAHEDRAL_SIZE } from './advanced-projections'
import { CUBE_CROSS, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH } from './projection-layout'
import type { Eye, Projection } from './projection-layout'
import { FACE_SIZE, PANORAMA } from './projections'

interface ProjectionTextures {
  faces: Texture[]
  panorama: Texture
  equiangular: Texture
  octahedral: Texture
}

function cubePreview(faces: Texture[] | Texture) {
  const material = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
  material.fragmentNode = Fn(() => {
    const screen = screenCoordinate.xy
    const tile = screen.div(PREVIEW_FACE_SIZE).floor().toVar()
    const facePixel = ivec2(screen.mod(PREVIEW_FACE_SIZE).mul(FACE_SIZE / PREVIEW_FACE_SIZE)).toVar()
    const result = vec4(0, 0, 0, 0).toVar()
    CUBE_CROSS.forEach(({ column, row }, index) => {
      If(tile.x.equal(column).and(tile.y.equal(row)), () => {
        const color = Array.isArray(faces)
          ? textureLoad(faces[index], facePixel)
          : textureLoad(faces, facePixel.add(ivec2(index % EAC_COLUMNS, Math.floor(index / EAC_COLUMNS)).mul(FACE_SIZE)))
        result.assign(vec4(sRGBTransferOETF(color.rgb), 1))
      })
    })
    return result
  })()
  return material
}

function flatPreview(texture: Texture, width: number, height: number, projection: Projection) {
  const material = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
  const scale = vec2(width / PREVIEW_WIDTH, height / PREVIEW_HEIGHT[projection])
  material.fragmentNode = vec4(sRGBTransferOETF(textureLoad(texture, ivec2(screenCoordinate.xy.mul(scale))).rgb), 1)
  return material
}

export function createProjectionReadback(renderer: WebGPURenderer, eyes: ProjectionTextures[]) {
  const quad = new QuadMesh()
  const cross = new RenderTarget(PREVIEW_WIDTH, PREVIEW_HEIGHT.cubemap, { depthBuffer: false })
  const targets = {
    cubemap: cross,
    equiangular: cross,
    equirectangular: new RenderTarget(PREVIEW_WIDTH, PREVIEW_HEIGHT.equirectangular, { depthBuffer: false }),
    octahedral: new RenderTarget(PREVIEW_WIDTH, PREVIEW_HEIGHT.octahedral, { depthBuffer: false }),
  }
  const materials = eyes.map(({ faces, panorama, equiangular, octahedral }) => ({
    cubemap: cubePreview(faces),
    equiangular: cubePreview(equiangular),
    equirectangular: flatPreview(panorama, PANORAMA.width, PANORAMA.height, 'equirectangular'),
    octahedral: flatPreview(octahedral, OCTAHEDRAL_SIZE, OCTAHEDRAL_SIZE, 'octahedral'),
  }))

  return function readProjection(projection: Projection, eye: Eye) {
    const target = targets[projection]
    const previousTarget = renderer.getRenderTarget()
    try {
      renderer.setRenderTarget(target)
      quad.material = materials[eye][projection]
      quad.render(renderer)
      return renderer.readRenderTargetPixelsAsync(target, 0, 0, target.width, target.height)
    } finally {
      renderer.setRenderTarget(previousTarget)
    }
  }
}
