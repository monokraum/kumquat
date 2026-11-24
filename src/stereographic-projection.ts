import type { Texture } from 'three/webgpu'
import { abs, floor, Fn, ivec2, mix, select, textureLoad, vec2, vec3 } from 'three/tsl'
import { STEREOGRAPHIC_DISK_SIZE, STEREOGRAPHIC_RADIUS } from './projection-layout'

type ShaderValue = ReturnType<typeof vec3>

export const stereographicDiskCoordinate = Fn<[ShaderValue]>(([pixel]) =>
  vec2(pixel.x.mod(STEREOGRAPHIC_DISK_SIZE), pixel.y)
    .sub(STEREOGRAPHIC_DISK_SIZE / 2).div(STEREOGRAPHIC_RADIUS))

export const stereographicDirection = Fn<[ShaderValue]>(([pixel]) => {
  const side = select(pixel.x.lessThan(STEREOGRAPHIC_DISK_SIZE), 1, -1)
  const disk = stereographicDiskCoordinate(pixel).toVar()
  const squaredRadius = disk.dot(disk).toVar()
  return vec3(disk.x.mul(side).mul(2), disk.y.mul(-2), squaredRadius.sub(1).mul(side))
    .div(squaredRadius.add(1))
})

export function stereographicSampler(atlas: Texture) {
  return Fn<[ShaderValue]>(([direction]) => {
    const front = direction.z.lessThanEqual(0)
    const disk = vec2(select(front, direction.x, direction.x.negate()), direction.y.negate())
      .div(abs(direction.z).add(1))
    const centerX = select(front, STEREOGRAPHIC_DISK_SIZE / 2, STEREOGRAPHIC_DISK_SIZE * 1.5)
    const sample = disk.mul(STEREOGRAPHIC_RADIUS)
      .add(vec2(centerX, STEREOGRAPHIC_DISK_SIZE / 2)).sub(0.5).toVar()
    const base = floor(sample).toVar()
    const weight = sample.sub(base).toVar()
    const texel = ivec2(base)
    // Both disks continue past the hemisphere boundary inside their two-texel margins.
    const top = mix(textureLoad(atlas, texel), textureLoad(atlas, texel.add(ivec2(1, 0))), weight.x)
    const bottom = mix(textureLoad(atlas, texel.add(ivec2(0, 1))), textureLoad(atlas, texel.add(ivec2(1, 1))), weight.x)
    return mix(top, bottom, weight.y)
  })
}
