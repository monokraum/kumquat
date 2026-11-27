import { Vector3 } from 'three/webgpu'
import type { PerspectiveCamera } from 'three/webgpu'

type Direction = 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'

const directions = new Map<string, Direction>([
  ['z', 'forward'], ['w', 'forward'], ['arrowup', 'forward'],
  ['s', 'back'], ['arrowdown', 'back'],
  ['q', 'left'], ['a', 'left'], ['arrowleft', 'left'],
  ['d', 'right'], ['arrowright', 'right'],
  [' ', 'up'], ['shift', 'down'],
])
const up = new Vector3(0, 1, 0)
const lookSpeed = 0.0045
const pitchLimit = 89 * Math.PI / 180
const metresPerSecond = 5

export function createSceneWalkControls(camera: PerspectiveCamera, viewport: HTMLElement, schedule: () => void) {
  const keys = new Map<string, Direction>()
  const move = new Vector3()
  let enabled = false
  let previousTime = 0
  let yaw = 0
  let pitch = 0
  let drag: { id: number, x: number, y: number } | undefined

  function stopDrag() {
    if (!drag) return
    const { id } = drag
    drag = undefined
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
  }

  function stopInput() {
    keys.clear()
    stopDrag()
  }

  viewport.addEventListener('pointerdown', (event) => {
    if (!enabled || event.button !== 0 || drag) return
    viewport.focus({ preventScroll: true })
    viewport.setPointerCapture(event.pointerId)
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
  })
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return
    yaw = (yaw - (event.clientX - drag.x) * lookSpeed) % (2 * Math.PI)
    pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch - (event.clientY - drag.y) * lookSpeed))
    camera.rotation.set(pitch, yaw, 0, 'YXZ')
    drag.x = event.clientX
    drag.y = event.clientY
    schedule()
  })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    viewport.addEventListener(type, (event) => {
      if (drag?.id === event.pointerId) stopDrag()
    })
  }

  viewport.addEventListener('keydown', (event) => {
    if (!enabled || event.ctrlKey || event.altKey || event.metaKey) return
    const key = event.key.toLowerCase()
    const direction = directions.get(key)
    if (!direction) return
    event.preventDefault()
    if (!keys.size) previousTime = performance.now()
    keys.set(event.code || key, direction)
    schedule()
  })
  viewport.addEventListener('keyup', (event) => {
    if (keys.delete(event.code || event.key.toLowerCase())) event.preventDefault()
  })
  viewport.addEventListener('blur', stopInput)
  window.addEventListener('blur', stopInput)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopInput()
  })

  return {
    setEnabled(value: boolean) {
      enabled = value
      if (!enabled) stopInput()
    },
    reset() {
      stopInput()
      yaw = pitch = 0
      camera.position.set(0, 0, 0)
      camera.rotation.set(0, 0, 0, 'YXZ')
    },
    update() {
      if (!keys.size) return
      const now = performance.now()
      const delta = Math.min((now - previousTime) / 1000, 0.05)
      previousTime = now
      const pressed = new Set(keys.values())
      move.set(
        Number(pressed.has('right')) - Number(pressed.has('left')),
        Number(pressed.has('up')) - Number(pressed.has('down')),
        Number(pressed.has('back')) - Number(pressed.has('forward')),
      )
      camera.position.addScaledVector(move.normalize().applyAxisAngle(up, yaw), metresPerSecond * delta)
      schedule()
    },
  }
}
