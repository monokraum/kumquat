import type { Texture } from 'three/webgpu'
import { abs, atan, floor, Fn, If, ivec2, max, mix, select, tan, textureLoad, vec2, vec3, vec4 } from 'three/tsl'
import { FACES } from './camera'
import { FACE_SIZE } from './projections'

export const EAC_COLUMNS = 3
export const OCTAHEDRAL_SIZE = 2508
export const PROJECTION_SOURCE_SIZE = 2048

type ShaderValue = ReturnType<typeof vec3>

export function equiangularCapture(faces: Texture[]) {
  return Fn<[ShaderValue]>(([pixel]) => {
    const tile = floor(pixel.div(FACE_SIZE)).toVar()
    const local = pixel.mod(FACE_SIZE).div(FACE_SIZE)
    const perspective = tan(local.sub(0.5).mul(Math.PI / 2))
    const source = floor(perspective.mul(0.5).add(0.5).mul(PROJECTION_SOURCE_SIZE))
      .clamp(0, PROJECTION_SOURCE_SIZE - 1).toVar()
    const color = vec4(0).toVar()
    faces.forEach((texture, index) => {
      If(tile.x.equal(index % EAC_COLUMNS).and(tile.y.equal(Math.floor(index / EAC_COLUMNS))), () => {
        color.assign(textureLoad(texture, ivec2(source)))
      })
    })
    return color
  })
}

export function equiangularSampler(atlas: Texture) {
  return Fn<[ShaderValue]>(([direction]) => {
    const magnitude = abs(direction).toVar()
    const dominant = max(magnitude.x, max(magnitude.y, magnitude.z)).toVar()
    const texel = ivec2(0).toVar()
    FACES.forEach(({ forward, up, right }, index) => {
      If(direction.dot(vec3(forward)).equal(dominant), () => {
        const perspective = vec2(direction.dot(vec3(right)), direction.dot(vec3(up)).negate()).div(dominant)
        const local = floor(atan(perspective).div(Math.PI / 2).add(0.5).mul(FACE_SIZE)).clamp(0, FACE_SIZE - 1)
        const tile = vec2(index % EAC_COLUMNS, Math.floor(index / EAC_COLUMNS))
        texel.assign(ivec2(tile.mul(FACE_SIZE).add(local)))
      })
    })
    return textureLoad(atlas, texel)
  })
}

const signNotZero = Fn<[ShaderValue]>(([position]) =>
  vec2(select(position.x.lessThan(0), -1, 1), select(position.y.lessThan(0), -1, 1)))

export const octahedralDirection = Fn<[ShaderValue]>(([pixel]) => {
  const local = pixel.div(OCTAHEDRAL_SIZE).mul(2).sub(1).toVar()
  const front = abs(local.x).add(abs(local.y)).oneMinus().toVar()
  const unfolded = local.add(signNotZero(local).mul(front.min(0))).toVar()
  return vec3(unfolded.x, unfolded.y.negate(), front.negate()).normalize()
})

export function octahedralSampler(texture: Texture) {
  return Fn<[ShaderValue]>(([direction]) => {
    const sum = abs(direction.x).add(abs(direction.y)).add(abs(direction.z))
    const local = vec2(direction.x, direction.y.negate()).div(sum).toVar()
    const folded = abs(local.yx).oneMinus().mul(signNotZero(local))
    const pixel = select(direction.z.greaterThan(0), folded, local)
      .mul(0.5).add(0.5).mul(OCTAHEDRAL_SIZE).sub(0.5).toVar()
    const base = floor(pixel).toVar()
    const weight = pixel.sub(base).toVar()

    function read(offsetX: number, offsetY: number) {
      const tap = base.add(vec2(offsetX, offsetY)).toVar()
      const outsideX = tap.x.lessThan(0).or(tap.x.greaterThanEqual(OCTAHEDRAL_SIZE))
      const last = OCTAHEDRAL_SIZE - 1
      // Across each edge, the neighboring texel is mirrored along that edge.
      const x = select(outsideX, tap.x.clamp(0, last), tap.x).toVar()
      const y = select(outsideX, tap.y.negate().add(last), tap.y).toVar()
      const outsideY = y.lessThan(0).or(y.greaterThanEqual(OCTAHEDRAL_SIZE))
      return textureLoad(texture, ivec2(select(outsideY, x.negate().add(last), x), y.clamp(0, last)))
    }

    return mix(mix(read(0, 0), read(1, 0), weight.x), mix(read(0, 1), read(1, 1), weight.x), weight.y)
  })
}
