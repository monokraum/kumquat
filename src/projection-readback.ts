import { MeshBasicNodeMaterial, QuadMesh, RenderTarget } from 'three/webgpu'
import type { Texture, WebGPURenderer } from 'three/webgpu'
import { Fn, If, ivec2, screenCoordinate, sRGBTransferOETF, textureLoad, vec2, vec4 } from 'three/tsl'
import { CUBE_CROSS, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH } from './projection-layout'
import type { Eye, Projection } from './projection-layout'
import { FACE_SIZE, PANORAMA } from './projections'

interface ProjectionTextures {
  faces: Texture[]
  panorama: Texture
}

export function createProjectionReadback(renderer: WebGPURenderer, eyes: ProjectionTextures[]) {
  const quad = new QuadMesh()
  const targets = {
    cubemap: new RenderTarget(PREVIEW_WIDTH, PREVIEW_HEIGHT.cubemap, { depthBuffer: false }),
    equirectangular: new RenderTarget(PREVIEW_WIDTH, PREVIEW_HEIGHT.equirectangular, { depthBuffer: false }),
  }
  const materials = eyes.map(({ faces, panorama }) => {
    const cubemap = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
    cubemap.fragmentNode = Fn(() => {
      const screen = screenCoordinate.xy
      const tile = screen.div(PREVIEW_FACE_SIZE).floor().toVar()
      const facePixel = ivec2(screen.mod(PREVIEW_FACE_SIZE).mul(FACE_SIZE / PREVIEW_FACE_SIZE))
      const result = vec4(0, 0, 0, 0).toVar()
      CUBE_CROSS.forEach(({ column, row }, index) => {
        If(tile.x.equal(column).and(tile.y.equal(row)), () => {
          result.assign(vec4(sRGBTransferOETF(textureLoad(faces[index], facePixel).rgb), 1))
        })
      })
      return result
    })()

    const equirectangular = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false })
    const scale = vec2(PANORAMA.width / PREVIEW_WIDTH, PANORAMA.height / PREVIEW_HEIGHT.equirectangular)
    equirectangular.fragmentNode = vec4(sRGBTransferOETF(textureLoad(panorama, ivec2(screenCoordinate.xy.mul(scale))).rgb), 1)
    return { cubemap, equirectangular }
  })

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
