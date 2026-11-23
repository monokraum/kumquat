import type { Texture } from 'three/webgpu'
import { abs, asin, atan, cos, floor, Fn, If, int, ivec2, max, mix, select, sin, textureLoad, vec2, vec3, vec4 } from 'three/tsl'
import { FACES } from './camera'

export const FACE_SIZE = 1024
export const PANORAMA = { width: 4096, height: 2048 }
type ShaderValue = ReturnType<typeof vec3>

export function cubemapSampler(textures: Texture[], size = FACE_SIZE) {
  return Fn<[ShaderValue]>(([direction]) => {
    const magnitude = abs(direction).toVar()
    const dominant = max(magnitude.x, max(magnitude.y, magnitude.z)).toVar()
    const color = vec4(0).toVar()

    FACES.forEach(({ forward, up, right }, index) => {
      const depth = direction.dot(vec3(forward))
      If(depth.equal(dominant), () => {
        const faceXY = vec2(direction.dot(vec3(right)), direction.dot(vec3(up)).negate()).div(dominant)
        const texel = floor(faceXY.mul(0.5).add(0.5).mul(size)).clamp(0, size - 1)
        color.assign(textureLoad(textures[index], ivec2(texel)))
      })
    })
    return color
  })
}

export const panoramaDirection = Fn<[ShaderValue]>(([pixel]) => {
  const longitude = pixel.x.div(PANORAMA.width).sub(0.5).mul(2 * Math.PI)
  const latitude = pixel.y.div(PANORAMA.height).oneMinus().sub(0.5).mul(Math.PI)
  const radius = cos(latitude)
  return vec3(radius.mul(sin(longitude)), sin(latitude), radius.mul(cos(longitude)).negate())
})

export function panoramaSampler(texture: Texture) {
  return Fn<[ShaderValue]>(([direction]) => {
    const atPole = abs(direction.x).add(abs(direction.z)).lessThan(1e-7)
    const longitude = atan(direction.x, select(atPole, 1, direction.z.negate()))
    const latitude = asin(direction.y.clamp(-1, 1))
    const sample = vec2(longitude.div(2 * Math.PI).add(0.5), latitude.div(Math.PI).oneMinus().sub(0.5))
      .mul(vec2(PANORAMA.width, PANORAMA.height)).sub(0.5).toVar()
    const base = floor(sample).toVar()
    const weight = sample.sub(base).toVar()
    // Horizontal bilinear taps straddle the +Z seam. Vertical taps stop at the poles.
    const x0 = int(base.x.add(PANORAMA.width)).mod(PANORAMA.width)
    const x1 = x0.add(1).mod(PANORAMA.width)
    const y0 = int(base.y.clamp(0, PANORAMA.height - 1))
    const y1 = int(base.y.add(1).clamp(0, PANORAMA.height - 1))
    const top = mix(textureLoad(texture, ivec2(x0, y0)), textureLoad(texture, ivec2(x1, y0)), weight.x)
    const bottom = mix(textureLoad(texture, ivec2(x0, y1)), textureLoad(texture, ivec2(x1, y1)), weight.x)
    return mix(top, bottom, weight.y)
  })
}
