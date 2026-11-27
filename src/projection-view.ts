import type { LineOfSight } from './camera'
import { createProjectionDensityTile } from './projection-density'
import { projectionAngleCircles, projectionFootprint } from './projection-footprint'
import {
  CUBE_CROSS, hasCubeFaces, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH, PROJECTION_MAP_LABELS,
  STEREOGRAPHIC_PREVIEW_RADIUS,
} from './projection-layout'
import type { Eye, Projection } from './projection-layout'
import type { createProjectionReadback } from './projection-readback'

interface PreviewSettings {
  projection: Projection
  eye: Eye
  revision: number
  los: LineOfSight
  showAngleCircles: boolean
  showDensity: boolean
}

export function createProjectionView(
  viewport: HTMLElement,
  map: HTMLCanvasElement,
  outline: HTMLCanvasElement,
  status: HTMLElement,
) {
  // These layers already receive CPU pixels and paths. Keep their rasterization on the CPU.
  const background = map.getContext('2d', { willReadFrequently: true })!
  const overlay = outline.getContext('2d', { willReadFrequently: true })!
  let key = ''
  let generation = 0
  let reading = false
  let pending: { settings: PreviewSettings; generation: number; read: ReturnType<typeof createProjectionReadback> } | undefined
  const angleCircles = new Map<Projection, ReturnType<typeof projectionAngleCircles>>()
  const densityTiles = new Map<Projection, ImageData>()

  function strokePaths(paths: ReturnType<typeof projectionFootprint>, color: string) {
    overlay.beginPath()
    for (const [first, ...rest] of paths) {
      overlay.moveTo(first.x, first.y)
      for (const { x, y } of rest) overlay.lineTo(x, y)
    }
    overlay.lineWidth = 5.5
    overlay.strokeStyle = '#101821'
    overlay.stroke()
    overlay.lineWidth = 2.5
    overlay.strokeStyle = color
    overlay.stroke()
  }

  function drawOutline({ projection, los, showAngleCircles }: PreviewSettings) {
    overlay.clearRect(0, 0, outline.width, outline.height)
    overlay.save()
    if (hasCubeFaces(projection)) {
      overlay.beginPath()
      for (const { column, row } of CUBE_CROSS) {
        overlay.rect(column * PREVIEW_FACE_SIZE, row * PREVIEW_FACE_SIZE, PREVIEW_FACE_SIZE, PREVIEW_FACE_SIZE)
      }
      overlay.clip()
    } else if (projection === 'stereographic') {
      overlay.beginPath()
      const size = PREVIEW_HEIGHT.stereographic
      for (const centerX of [size / 2, size * 1.5]) {
        overlay.moveTo(centerX + STEREOGRAPHIC_PREVIEW_RADIUS, size / 2)
        overlay.arc(centerX, size / 2, STEREOGRAPHIC_PREVIEW_RADIUS, 0, 2 * Math.PI)
      }
      overlay.clip()
    }
    overlay.lineCap = 'round'
    overlay.lineJoin = 'round'
    if (showAngleCircles) {
      let paths = angleCircles.get(projection)
      if (!paths) {
        paths = projectionAngleCircles(projection)
        angleCircles.set(projection, paths)
      }
      strokePaths(paths, '#ffd07d')
    }
    strokePaths(projectionFootprint(projection, los), '#9af2d8')
    overlay.restore()
  }

  function labelFaces() {
    background.font = '16px ui-monospace, monospace'
    background.textBaseline = 'middle'
    for (const { column, row, label } of CUBE_CROSS) {
      const x = column * PREVIEW_FACE_SIZE + 0.5
      const y = row * PREVIEW_FACE_SIZE + 0.5
      background.strokeStyle = '#657385'
      background.strokeRect(x, y, PREVIEW_FACE_SIZE - 1, PREVIEW_FACE_SIZE - 1)
      background.fillStyle = '#101821'
      background.fillRect(x + 8, y + 8, 34, 24)
      background.fillStyle = '#eef1f5'
      background.fillText(label, x + 15, y + 20)
    }
  }

  function labelHemispheres() {
    background.font = '16px ui-monospace, monospace'
    background.textBaseline = 'top'
    background.fillStyle = '#eef1f5'
    background.fillText('Avant', 12, 12)
    background.fillText('Arrière', PREVIEW_HEIGHT.stereographic + 12, 12)
  }

  function finishBackground(projection: Projection) {
    if (hasCubeFaces(projection)) labelFaces()
    else if (projection === 'stereographic') labelHemispheres()
    viewport.dataset.state = 'ready'
    status.textContent = ''
  }

  function drawDensity(projection: Projection) {
    let tile = densityTiles.get(projection)
    if (!tile) {
      tile = createProjectionDensityTile(projection)
      densityTiles.set(projection, tile)
    }
    if (hasCubeFaces(projection)) {
      for (const { column, row } of CUBE_CROSS) {
        background.putImageData(tile, column * tile.width, row * tile.height)
      }
    } else {
      background.putImageData(tile, 0, 0)
      if (projection === 'stereographic') background.putImageData(tile, tile.width, 0)
    }
    finishBackground(projection)
  }

  async function readPending() {
    if (reading) return
    reading = true
    while (pending) {
      const job = pending
      pending = undefined
      const { projection, eye } = job.settings
      try {
        const pixels = await job.read(projection, eye)
        if (job.generation !== generation) continue
        const image = background.createImageData(map.width, map.height)
        image.data.set(pixels)
        background.putImageData(image, 0, 0)
        finishBackground(projection)
      } catch (error) {
        if (job.generation !== generation) continue
        console.error(error)
        viewport.dataset.state = 'error'
        status.textContent = 'La carte de projection est indisponible.'
      }
    }
    reading = false
  }

  function update(settings: PreviewSettings, read: ReturnType<typeof createProjectionReadback>) {
    const { projection, eye, revision, showDensity } = settings
    const source = showDensity ? `density:${projection}` : `${projection}:${eye}:${revision}`
    if (source !== key) {
      key = source
      generation++
      pending = undefined
      viewport.dataset.projection = projection
      map.width = outline.width = PREVIEW_WIDTH
      map.height = outline.height = PREVIEW_HEIGHT[projection]
      const layout = PROJECTION_MAP_LABELS[projection]
      if (showDensity) {
        map.setAttribute('aria-label', `${layout}, densité de pixels et champ de vision`)
        map.setAttribute('aria-describedby', 'projection-density-legend')
        drawDensity(projection)
      } else {
        map.setAttribute('aria-label', `${layout} et champ de vision de l’œil ${eye === 0 ? 'gauche' : 'droit'}`)
        map.removeAttribute('aria-describedby')
        viewport.dataset.state = 'loading'
        status.textContent = 'Chargement de la carte…'
        pending = { settings, generation, read }
        void readPending()
      }
    }
    drawOutline(settings)
  }

  function reset() {
    key = ''
    generation++
    pending = undefined
    background.clearRect(0, 0, map.width, map.height)
    overlay.clearRect(0, 0, outline.width, outline.height)
    viewport.dataset.state = 'error'
    status.textContent = 'La carte de projection est indisponible.'
  }

  return { update, reset }
}
