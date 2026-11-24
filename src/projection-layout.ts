export const PROJECTION_MAP_LABELS = {
  cubemap: 'Cubemap en croix',
  equirectangular: 'Panorama équirectangulaire',
  equiangular: 'Cubemap équiangulaire en croix',
  octahedral: 'Carte octaédrique',
  stereographic: 'Disques stéréographiques avant et arrière',
}

export type Projection = keyof typeof PROJECTION_MAP_LABELS
export type Eye = 0 | 1

export function isProjection(value: string): value is Projection {
  return Object.hasOwn(PROJECTION_MAP_LABELS, value)
}

export function hasCubeFaces(projection: Projection) {
  return projection === 'cubemap' || projection === 'equiangular'
}

export const PREVIEW_FACE_SIZE = 256
export const PREVIEW_WIDTH = PREVIEW_FACE_SIZE * 4
export const STEREOGRAPHIC_DISK_SIZE = 2048
export const STEREOGRAPHIC_RADIUS = STEREOGRAPHIC_DISK_SIZE / 2 - 2
export const STEREOGRAPHIC_PREVIEW_RADIUS = (PREVIEW_WIDTH / 2) * STEREOGRAPHIC_RADIUS / STEREOGRAPHIC_DISK_SIZE
export const PREVIEW_HEIGHT = {
  cubemap: PREVIEW_FACE_SIZE * 3,
  equirectangular: PREVIEW_WIDTH / 2,
  equiangular: PREVIEW_FACE_SIZE * 3,
  octahedral: PREVIEW_WIDTH,
  stereographic: PREVIEW_WIDTH / 2,
}

// Same order as the capture cameras in FACES, with the forward face at the center.
export const CUBE_CROSS = [
  { column: 2, row: 1, label: '+X' },
  { column: 0, row: 1, label: '−X' },
  { column: 1, row: 0, label: '+Y' },
  { column: 1, row: 2, label: '−Y' },
  { column: 3, row: 1, label: '+Z' },
  { column: 1, row: 1, label: '−Z' },
]
