import { WebGPURenderer } from 'three/webgpu'
import type { Scene } from 'three/webgpu'
import { FRAME } from './camera'
import { createPipeline } from './pipeline'
import type { FrameRegion, StereoView } from './pipeline'
import { isProjection } from './projection-layout'
import { createProjectionView } from './projection-view'
import { createSceneExplorer } from './scene-explorer'
import { defaultReference, disposeScene, readScene, referenceBytes, referenceScenes } from './scenes'
import './style.css'

function element<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T
}

const backend = element('backend')
const backendBadge = backend.parentElement!
const workspace = element('workspace')
const viewport = element('viewport')
const status = element('render-status')
const sceneName = element('scene-name')
const sceneControls = element<HTMLFieldSetElement>('scene-controls')
const controls = element<HTMLFieldSetElement>('controls')
const file = element<HTMLInputElement>('scene-file')
const reference = element<HTMLSelectElement>('reference')
const projection = element<HTMLSelectElement>('projection')
const projectionKind = element('projection-kind')
const yaw = element<HTMLInputElement>('yaw')
const pitch = element<HTMLInputElement>('pitch')
const roll = element<HTMLInputElement>('roll')
const baseline = element<HTMLInputElement>('baseline')
const stereoControls = element('stereo-controls')
const stereoPanel = element('stereo-panel')
const mapPanel = element('projection-panel')
const mapViewport = element('projection-preview')
const stereoCanvas = element('stereo-canvas')
const eyeFrames = [element('frame-left'), element('frame-right')] as const
const previewEyes = element<HTMLFieldSetElement>('projection-eyes')
const angleCircles = element<HTMLInputElement>('projection-angle-circles')
const scenePanel = element('scene-panel')
const sceneViewport = element('scene-viewport')
const sceneLos = element('scene-los')
const sceneReset = element<HTMLButtonElement>('scene-reset')
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('#view-tabs [role=tab]'))
const fullscreen = element<HTMLButtonElement>('fullscreen')
const projectionView = createProjectionView(
  mapViewport,
  element<HTMLCanvasElement>('projection-map'),
  element<HTMLCanvasElement>('projection-outline'),
  element('projection-status'),
)
type WorkspaceView = StereoView | 'scene'
let view: WorkspaceView = 'reprojected'
let renderer: WebGPURenderer | undefined
let pipeline: ReturnType<typeof createPipeline> | undefined
let explorer: ReturnType<typeof createSceneExplorer> | undefined
let scene: Scene | undefined
let activeReference = ''
let loadVersion = 0
let scheduled = false

for (const { id, label } of referenceScenes) {
  reference.add(new Option(label, id))
}

function message(text: string, error = false) {
  status.textContent = text
  status.dataset.error = String(error)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function numberValue(control: HTMLInputElement, fallback: number) {
  const value = control.valueAsNumber
  return Number.isFinite(value) ? Math.min(Number(control.max), Math.max(Number(control.min), value)) : fallback
}

function showView(next: WorkspaceView) {
  if (next !== view) endLosDrag()
  view = next
  document.body.dataset.view = view
  scenePanel.hidden = view !== 'scene'
  stereoPanel.hidden = view === 'scene'
  stereoControls.hidden = view === 'scene'
  mapPanel.hidden = view !== 'reprojected'
  projection.disabled = view !== 'reprojected'
  element('projection-control').dataset.inactive = String(projection.disabled)
  if (view !== 'scene') {
    stereoPanel.setAttribute('aria-labelledby', `tab-${view}`)
    const label = view === 'direct' ? 'Rendu direct' : 'Vue reprojetée'
    document.querySelectorAll('.view-kind').forEach((node) => { node.textContent = label })
  }
  for (const tab of tabs) {
    const selected = tab.dataset.view === view
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
  }
  schedule()
}

function fitFrame(frame: HTMLElement, surface: DOMRect, scaleX: number, scaleY: number): FrameRegion {
  const rect = frame.getBoundingClientRect()
  const scale = Math.max(.001, Math.min(rect.width / FRAME.width, rect.height / FRAME.height))
  const width = FRAME.width * scale
  const height = FRAME.height * scale
  return [
    (rect.left - surface.left + (rect.width - width) / 2) * scaleX,
    (rect.top - surface.top + (rect.height - height) / 2) * scaleY,
    width * scaleX,
    height * scaleY,
  ]
}

const angleFormat = new Intl.NumberFormat('fr', { maximumFractionDigits: 1 })

function draw(activeScene: Scene) {
  if (!renderer || !pipeline || !explorer) return
  const host = view === 'scene' ? sceneViewport : stereoCanvas
  const surface = host.getBoundingClientRect()
  if (!surface.width || !surface.height) return

  if (renderer.domElement.parentElement !== host) host.prepend(renderer.domElement)
  const ratio = Math.min(window.devicePixelRatio, 2)
  const width = Math.max(1, Math.round(surface.width * ratio))
  const height = Math.max(1, Math.round(surface.height * ratio))
  if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
    renderer.setSize(width, height, false)
  }

  const los = { yaw: numberValue(yaw, 0), pitch: numberValue(pitch, 0), roll: numberValue(roll, 0) }
  const gap = numberValue(baseline, 63)
  if (view === 'scene') {
    explorer.draw(activeScene, los, gap, width / height)
    sceneLos.textContent = [los.yaw, los.pitch, los.roll].map((value) => angleFormat.format(value) + '°').join(' · ')
    return
  }

  const mode = isProjection(projection.value) ? projection.value : 'cubemap'
  const scaleX = width / surface.width
  const scaleY = height / surface.height
  const revision = pipeline.draw(activeScene, {
    view,
    frames: [fitFrame(eyeFrames[0], surface, scaleX, scaleY), fitFrame(eyeFrames[1], surface, scaleX, scaleY)],
    projection: mode,
    los,
    baseline: gap,
  })
  if (view === 'reprojected') {
    const eye = previewEyes.querySelector<HTMLInputElement>('input:checked')?.value === 'right' ? 1 : 0
    projectionKind.textContent = projection.selectedOptions[0].text
    projectionView.update({ projection: mode, eye, revision, los, showAngleCircles: angleCircles.checked }, pipeline.readProjection)
  }
}

function schedule() {
  if (!scene || scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    if (!scene) return
    try {
      draw(scene)
    } catch (error) {
      console.error(error)
      message(`Erreur de rendu. ${errorMessage(error)}`, true)
    }
  })
}

async function load(name: string, source: () => Promise<ArrayBuffer>, referenceId = '') {
  const version = ++loadVersion
  message(`Chargement de ${name}…`)
  let next: Scene | undefined
  try {
    next = await readScene(await source())
    if (version !== loadVersion) return
    draw(next)
    if (scene) disposeScene(scene)
    scene = next
    explorer?.setScene(scene)
    next = undefined
    activeReference = referenceId
    reference.value = referenceId
    sceneName.textContent = referenceId && referenceId === defaultReference?.id ? 'Scène de référence' : name
    sceneName.title = name
    viewport.dataset.ready = 'true'
    previewEyes.disabled = false
    sceneReset.disabled = false
    message('')
  } catch (error) {
    if (version === loadVersion) {
      reference.value = activeReference
      const stage = next ? 'Rendu de la scène impossible.' : 'Chargement du GLB impossible.'
      message(`${stage} ${errorMessage(error)}`, true)
      if (!scene) projectionView.reset()
      schedule()
    }
  } finally {
    if (next) disposeScene(next)
  }
}

function loadReference(id: string) {
  const choice = referenceScenes.find((entry) => entry.id === id)
  if (choice) return load(choice.label, () => referenceBytes(choice.url), choice.id)
}

function openFile(selected: File | undefined) {
  if (selected) void load(selected.name, () => selected.arrayBuffer())
}

file.addEventListener('change', () => {
  openFile(file.files?.[0])
  file.value = ''
})
reference.addEventListener('change', () => void loadReference(reference.value))
projection.addEventListener('change', schedule)
previewEyes.addEventListener('change', schedule)
angleCircles.addEventListener('change', schedule)
sceneReset.addEventListener('click', () => explorer?.reset())

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => showView(tab.dataset.view as WorkspaceView))
  tab.addEventListener('keydown', (event) => {
    const destination = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined
    if (destination === undefined) return
    event.preventDefault()
    tabs[destination].focus()
    showView(tabs[destination].dataset.view as WorkspaceView)
  })
}

fullscreen.hidden = !document.fullscreenEnabled
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch (error) {
    message(`Plein écran indisponible. ${errorMessage(error)}`, true)
  }
})
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement)
  const label = active ? 'Quitter le plein écran' : 'Plein écran'
  fullscreen.setAttribute('aria-pressed', String(active))
  fullscreen.setAttribute('aria-label', label)
  fullscreen.title = label
  schedule()
})

const resize = new ResizeObserver(schedule)
for (const element of [stereoCanvas, sceneViewport, ...eyeFrames]) resize.observe(element)
;[yaw, pitch, roll, baseline].forEach((control) => {
  control.addEventListener('input', schedule)
  control.addEventListener('change', () => {
    control.value = String(numberValue(control, control === baseline ? 63 : 0))
    schedule()
  })
})
element('reset').addEventListener('click', () => {
  yaw.value = '0'
  pitch.value = '0'
  roll.value = '0'
  schedule()
})

workspace.addEventListener('dragover', (event) => {
  if (!sceneControls.disabled && event.dataTransfer?.types.includes('Files')) event.preventDefault()
})
workspace.addEventListener('drop', (event) => {
  if (sceneControls.disabled) return
  event.preventDefault()
  openFile(event.dataTransfer?.files[0])
})

interface LosDrag {
  surface: HTMLElement
  id: number
  x: number
  y: number
  yaw: number
  pitch: number
  degreesPerPixel: number
}

let drag: LosDrag | undefined

function endLosDrag() {
  if (!drag) return
  const { surface, id } = drag
  drag = undefined
  if (surface.hasPointerCapture(id)) surface.releasePointerCapture(id)
}

function enableLosDrag(surface: HTMLElement, dragScale: (event: PointerEvent) => number | undefined) {
  surface.addEventListener('pointerdown', (event) => {
    if (!scene || !pipeline || event.button !== 0 || drag) return
    const degreesPerPixel = dragScale(event)
    if (degreesPerPixel === undefined) return
    drag = {
      surface,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw: numberValue(yaw, 0),
      pitch: numberValue(pitch, 0),
      degreesPerPixel,
    }
    surface.setPointerCapture(event.pointerId)
  })
  surface.addEventListener('pointermove', (event) => {
    if (drag?.surface !== surface || event.pointerId !== drag.id) return
    const heading = drag.yaw + (event.clientX - drag.x) * drag.degreesPerPixel
    const elevation = drag.pitch - (event.clientY - drag.y) * drag.degreesPerPixel
    yaw.value = ((((heading + 180) % 360) + 360) % 360 - 180).toFixed(1)
    pitch.value = Math.max(-90, Math.min(90, elevation)).toFixed(1)
    schedule()
  })
  surface.addEventListener('lostpointercapture', (event) => {
    if (drag?.surface === surface && event.pointerId === drag.id) drag = undefined
  })
}

enableLosDrag(viewport, (event) => {
  if (event.target instanceof Element && event.target.closest('.eye-frame')) return 0.25
})
enableLosDrag(mapViewport, () => {
  if (view !== 'reprojected' || mapViewport.dataset.state !== 'ready') return
  const width = mapViewport.getBoundingClientRect().width
  if (width > 0) return 360 / width
})

async function initializeRenderer() {
  if (!window.isSecureContext) {
    throw new Error('WebGPU requiert un contexte sécurisé. Ouvrez app/index.html depuis le dossier décompressé ou utilisez l’adresse affichée par le lanceur Node.js.')
  }
  if (!navigator.gpu) {
    throw new Error('Le navigateur n’expose pas l’API WebGPU. Vérifiez l’accélération graphique dans chrome://gpu ou edge://gpu.')
  }
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('Le navigateur ne fournit aucun adaptateur WebGPU. Consultez « Problems Detected » dans chrome://gpu ou edge://gpu. Le GLB sera chargé après l’initialisation du rendu.')
  }

  let device: GPUDevice
  try {
    device = await adapter.requestDevice()
  } catch (error) {
    throw new Error(`Adaptateur WebGPU trouvé. La création du périphérique a échoué. ${errorMessage(error)}`)
  }

  const renderer = new WebGPURenderer({ antialias: false, device })
  try {
    await renderer.init()
  } catch (error) {
    device.destroy()
    throw new Error(`Périphérique WebGPU créé. L’initialisation du rendu Three.js a échoué. ${errorMessage(error)}`)
  }
  if (!('isWebGPUBackend' in renderer.backend) || renderer.backend.isWebGPUBackend !== true) {
    renderer.dispose()
    device.destroy()
    throw new Error('Three.js a basculé vers WebGL 2 pendant l’initialisation du rendu.')
  }
  return { renderer, software: adapter.info?.isFallbackAdapter === true }
}

async function start() {
  const { renderer: gpu, software } = await initializeRenderer()
  renderer = gpu
  const onDeviceLost = gpu.onDeviceLost.bind(gpu)
  gpu.onDeviceLost = (info) => {
    onDeviceLost(info)
    endLosDrag()
    loadVersion++
    renderer = undefined
    pipeline = undefined
    sceneControls.disabled = true
    controls.disabled = true
    previewEyes.disabled = true
    sceneReset.disabled = true
    projectionView.reset()
    viewport.dataset.ready = 'false'
    backend.textContent = 'WebGPU interrompu'
    backendBadge.dataset.state = 'error'
    message('Le périphérique WebGPU a été perdu. Rechargez la page pour relancer le rendu.', true)
  }
  pipeline = createPipeline(gpu)
  explorer = createSceneExplorer(gpu, sceneViewport, schedule)
  gpu.domElement.setAttribute('aria-hidden', 'true')
  backend.textContent = software ? 'WebGPU logiciel' : 'WebGPU actif'
  backendBadge.dataset.state = 'ready'
  sceneControls.disabled = false
  controls.disabled = false
  if (defaultReference) await loadReference(defaultReference.id)
  else message('Choisissez un fichier GLB pour afficher une scène.')
}

void start().catch((error) => {
  backend.textContent = 'WebGPU indisponible'
  backendBadge.dataset.state = 'error'
  projectionView.reset()
  message(errorMessage(error), true)
})
