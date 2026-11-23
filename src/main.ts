import { WebGPURenderer } from 'three/webgpu'
import type { Scene } from 'three/webgpu'
import { createPipeline } from './pipeline'
import { disposeScene, readScene, referenceBytes } from './scenes'
import './style.css'

function element<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T
}

const backend = element('backend')
const viewport = element('viewport')
const status = element('render-status')
const sceneName = element('scene-name')
const controls = element<HTMLFieldSetElement>('controls')
const file = element<HTMLInputElement>('scene-file')
const projection = element<HTMLSelectElement>('projection')
const yaw = element<HTMLInputElement>('yaw')
const pitch = element<HTMLInputElement>('pitch')
const roll = element<HTMLInputElement>('roll')
const baseline = element<HTMLInputElement>('baseline')
let pipeline: ReturnType<typeof createPipeline> | undefined
let scene: Scene | undefined
let loadVersion = 0
let scheduled = false

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

function draw(activeScene: Scene) {
  pipeline?.draw(activeScene, {
    projection: projection.value === 'equirectangular' ? 'equirectangular' : 'cubemap',
    los: { yaw: numberValue(yaw, 0), pitch: numberValue(pitch, 0), roll: numberValue(roll, 0) },
    baseline: numberValue(baseline, 63),
  })
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

async function load(name: string, source: () => Promise<ArrayBuffer>) {
  const version = ++loadVersion
  message(`Chargement de ${name}…`)
  let next: Scene | undefined
  try {
    next = await readScene(await source())
    if (version !== loadVersion) return
    draw(next)
    if (scene) disposeScene(scene)
    scene = next
    next = undefined
    sceneName.textContent = name
    viewport.dataset.ready = 'true'
    message('')
  } catch (error) {
    if (version === loadVersion) {
      const stage = next ? 'Rendu de la scène impossible.' : 'Chargement du GLB impossible.'
      message(`${stage} ${errorMessage(error)}`, true)
      schedule()
    }
  } finally {
    if (next) disposeScene(next)
  }
}

function loadReference() {
  return load('Scène de référence', referenceBytes)
}

function openFile(selected: File | undefined) {
  if (selected) void load(selected.name, () => selected.arrayBuffer())
}

file.addEventListener('change', () => {
  openFile(file.files?.[0])
  file.value = ''
})
element('reference').addEventListener('click', () => void loadReference())
projection.addEventListener('change', schedule)
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

viewport.addEventListener('dragover', (event) => {
  if (!controls.disabled && event.dataTransfer?.types.includes('Files')) event.preventDefault()
})
viewport.addEventListener('drop', (event) => {
  if (controls.disabled) return
  event.preventDefault()
  openFile(event.dataTransfer?.files[0])
})

let drag: { id: number; x: number; y: number; yaw: number; pitch: number } | undefined
viewport.addEventListener('pointerdown', (event) => {
  if (!scene || event.button !== 0 || drag) return
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    yaw: numberValue(yaw, 0),
    pitch: numberValue(pitch, 0),
  }
  viewport.setPointerCapture(event.pointerId)
})
viewport.addEventListener('pointermove', (event) => {
  if (event.pointerId !== drag?.id) return
  const heading = drag.yaw + (event.clientX - drag.x) * 0.25
  const elevation = drag.pitch - (event.clientY - drag.y) * 0.25
  yaw.value = ((((heading + 180) % 360) + 360) % 360 - 180).toFixed(1)
  pitch.value = Math.max(-90, Math.min(90, elevation)).toFixed(1)
  schedule()
})
viewport.addEventListener('lostpointercapture', (event) => {
  if (event.pointerId === drag?.id) drag = undefined
})

async function initializeRenderer() {
  if (!window.isSecureContext) {
    throw new Error('WebGPU requiert un contexte sécurisé. Ouvrez l’adresse 127.0.0.1 affichée par le lanceur Node.js.')
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
  const { renderer, software } = await initializeRenderer()
  const onDeviceLost = renderer.onDeviceLost.bind(renderer)
  renderer.onDeviceLost = (info) => {
    onDeviceLost(info)
    loadVersion++
    pipeline = undefined
    controls.disabled = true
    viewport.dataset.ready = 'false'
    backend.textContent = 'Backend WebGPU interrompu'
    backend.dataset.state = 'error'
    message('Le périphérique WebGPU a été perdu. Rechargez la page pour relancer le rendu.', true)
  }
  pipeline = createPipeline(renderer)
  backend.textContent = software ? 'Backend WebGPU actif · adaptateur logiciel' : 'Backend WebGPU actif'
  backend.dataset.state = 'ready'
  renderer.domElement.setAttribute('aria-label', 'Comparaison de la vue reprojetée et du rendu direct pour les deux yeux')
  viewport.prepend(renderer.domElement)
  controls.disabled = false
  await loadReference()
}

void start().catch((error) => {
  backend.textContent = 'Backend WebGPU indisponible'
  backend.dataset.state = 'error'
  message(errorMessage(error), true)
})
