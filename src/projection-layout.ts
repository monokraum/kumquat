export type Projection = 'cubemap' | 'equirectangular'
export type Eye = 0 | 1

export const PREVIEW_FACE_SIZE = 256
export const PREVIEW_WIDTH = PREVIEW_FACE_SIZE * 4
export const PREVIEW_HEIGHT = {
  cubemap: PREVIEW_FACE_SIZE * 3,
  equirectangular: PREVIEW_WIDTH / 2,
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
