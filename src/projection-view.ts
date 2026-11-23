import type { LineOfSight } from './camera'
import { projectionFootprint } from './projection-footprint'
import { CUBE_CROSS, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH } from './projection-layout'
import type { Eye, Projection } from './projection-layout'
import type { createProjectionReadback } from './projection-readback'

interface PreviewSettings {
  projection: Projection
  eye: Eye
  revision: number
  los: LineOfSight
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

  function drawOutline(projection: Projection, los: LineOfSight) {
    overlay.clearRect(0, 0, outline.width, outline.height)
    overlay.save()
    if (projection === 'cubemap') {
      overlay.beginPath()
      for (const { column, row } of CUBE_CROSS) {
        overlay.rect(column * PREVIEW_FACE_SIZE, row * PREVIEW_FACE_SIZE, PREVIEW_FACE_SIZE, PREVIEW_FACE_SIZE)
      }
      overlay.clip()
    }
    overlay.beginPath()
    for (const [first, ...rest] of projectionFootprint(projection, los)) {
      overlay.moveTo(first.x, first.y)
      for (const { x, y } of rest) overlay.lineTo(x, y)
    }
    overlay.lineCap = 'round'
    overlay.lineJoin = 'round'
    overlay.lineWidth = 5.5
    overlay.strokeStyle = '#101821'
    overlay.stroke()
    overlay.lineWidth = 2.5
    overlay.strokeStyle = '#9af2d8'
    overlay.stroke()
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
        if (projection === 'cubemap') labelFaces()
        viewport.dataset.state = 'ready'
        status.textContent = ''
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
    const { projection, eye, los, revision } = settings
    const source = `${projection}:${eye}:${revision}`
    if (source !== key) {
      key = source
      viewport.dataset.projection = projection
      viewport.dataset.state = 'loading'
      status.textContent = 'Chargement de la carte…'
      map.width = outline.width = PREVIEW_WIDTH
      map.height = outline.height = PREVIEW_HEIGHT[projection]
      const layout = projection === 'cubemap' ? 'Cubemap en croix' : 'Panorama équirectangulaire'
      map.setAttribute('aria-label', `${layout} et champ de vision de l’œil ${eye === 0 ? 'gauche' : 'droit'}`)
      pending = { settings, generation: ++generation, read }
      void readPending()
    }
    drawOutline(projection, los)
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
