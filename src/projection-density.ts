import { OCTAHEDRAL_SIZE } from './advanced-projections'
import {
  hasCubeFaces, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH, STEREOGRAPHIC_DISK_SIZE, STEREOGRAPHIC_RADIUS,
} from './projection-layout'
import type { Projection } from './projection-layout'
import { FACE_SIZE, PANORAMA } from './projections'

const palette = [
  [33, 29, 69],
  [61, 81, 154],
  [171, 100, 150],
  [255, 187, 89],
] as const
const minimumDensity = 250_000
const diskScale = STEREOGRAPHIC_DISK_SIZE / (2 * STEREOGRAPHIC_RADIUS)

export const projectionDensityGradient = `linear-gradient(to right, ${palette.map((rgb) => `rgb(${rgb.join(', ')})`).join(', ')})`

// Coordinates are local to one face, one disk tile, or the whole planar texture.
export function projectionPixelDensity(projection: Projection, u: number, v: number) {
  const x = 2 * u - 1
  const y = 2 * v - 1
  switch (projection) {
    case 'cubemap':
      // Radial projection of a plane at unit distance.
      return (FACE_SIZE / 2) ** 2 * (1 + x * x + y * y) ** 1.5
    case 'equiangular': {
      const a = Math.tan(x * Math.PI / 4)
      const b = Math.tan(y * Math.PI / 4)
      const dx = 1 + a * a
      const dy = 1 + b * b
      return (2 * FACE_SIZE / Math.PI) ** 2 * (1 + a * a + b * b) ** 1.5 / (dx * dy)
    }
    case 'equirectangular':
      // The solid-angle Jacobian is sin(colatitude).
      return PANORAMA.width * PANORAMA.height / (2 * Math.PI ** 2 * Math.sin(Math.PI * v))
    case 'octahedral': {
      const z = 1 - Math.abs(x) - Math.abs(y)
      const a = Math.abs(x) + Math.min(z, 0)
      const b = Math.abs(y) + Math.min(z, 0)
      return (OCTAHEDRAL_SIZE / 2) ** 2 * (a * a + b * b + z * z) ** 1.5
    }
    case 'stereographic': {
      const radiusSquared = (x * x + y * y) * diskScale ** 2
      if (radiusSquared > 1) return 0
      return (STEREOGRAPHIC_RADIUS / 2) ** 2 * (1 + radiusSquared) ** 2
    }
  }
}

export function createProjectionDensityTile(projection: Projection) {
  const height = hasCubeFaces(projection) ? PREVIEW_FACE_SIZE : PREVIEW_HEIGHT[projection]
  const width = projection === 'equirectangular' ? PREVIEW_WIDTH : height
  const image = new ImageData(width, height)
  for (let row = 0; row < height; row++) {
    const v = (row + 0.5) / height
    for (let column = 0; column < width; column++) {
      const density = projectionPixelDensity(projection, (column + 0.5) / width, v)
      if (density === 0) continue
      const color = Math.max(0, Math.min(palette.length - 1, Math.log2(density / minimumDensity)))
      const stop = Math.min(palette.length - 2, Math.floor(color))
      const blend = color - stop
      const lower = palette[stop]
      const upper = palette[stop + 1]
      const index = (row * width + column) * 4
      for (let channel = 0; channel < 3; channel++) {
        image.data[index + channel] = lower[channel] + (upper[channel] - lower[channel]) * blend
      }
      image.data[index + 3] = 255
    }
  }
  return image
}
