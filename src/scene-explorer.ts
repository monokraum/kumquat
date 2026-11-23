import {
  Box3, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, GridHelper, Group, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Sphere, SphereGeometry, Vector3,
} from 'three/webgpu'
import type { WebGPURenderer } from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { eyeOffset, imageBorderRays, orientationFor } from './camera'
import type { LineOfSight } from './camera'

const origin = new Vector3()
const orbitDirection = new Vector3(0.92, 0.66, 1).normalize()

function createCameraRig() {
  const corners = imageBorderRays()
  const edges: Vector3[] = []
  const faces: Vector3[] = []
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % corners.length]
    edges.push(origin, corner, corner, next)
    faces.push(origin, corner, next)
  })
  edges.push(origin, new Vector3(0, 0, -1))
  faces.push(corners[0], corners[1], corners[2], corners[0], corners[2], corners[3])
  const lineGeometry = new BufferGeometry().setFromPoints(edges)
  const faceGeometry = new BufferGeometry().setAttribute(
    'position', new Float32BufferAttribute(faces.flatMap((point) => point.toArray()), 3),
  )
  const markerGeometry = new SphereGeometry(1, 16, 10)
  const group = new Group()
  const eyes = [0x59e6d7, 0xffbb59].map((color) => {
    const eye = new Group()
    const marker = new Mesh(markerGeometry, new MeshBasicMaterial({ color }))
    const volume = new Group()
    volume.add(
      new LineSegments(lineGeometry, new LineBasicMaterial({ color })),
      new Mesh(faceGeometry, new MeshBasicMaterial({ color, transparent: true, opacity: 0.075, depthWrite: false, side: DoubleSide })),
    )
    eye.add(marker, volume)
    group.add(eye)
    return { eye, marker, volume }
  })
  return {
    group,
    update(los: LineOfSight, baseline: number, radius: number) {
      const orientation = orientationFor(los)
      const reach = Math.max(.03, Math.min(8, radius * .36))
      const markerRadius = Math.max(radius * .0025, Math.min(radius * .006, baseline / 2_500))
      eyes.forEach(({ eye, marker, volume }, index) => {
        eye.position.x = eyeOffset(index, baseline)
        eye.quaternion.copy(orientation)
        marker.scale.setScalar(markerRadius)
        volume.scale.setScalar(reach)
      })
    },
  }
}

export function createSceneExplorer(renderer: WebGPURenderer, viewport: HTMLElement, schedule: () => void) {
  const stage = new Scene()
  stage.background = new Color('#0c121e')
  const camera = new PerspectiveCamera(43, 1, 0.01, 10_000)
  const controls = new OrbitControls(camera, viewport)
  controls.listenToKeyEvents(viewport)
  controls.addEventListener('change', schedule)
  const grid = new GridHelper(2, 24, 0x526073, 0x263140)
  const rig = createCameraRig()
  stage.add(grid, rig.group)

  const bounds = new Box3()
  const sphere = new Sphere()
  let activeScene: Scene | undefined
  let radius = 1
  let fitPending = true

  function setScene(scene: Scene) {
    if (activeScene === scene) return
    if (activeScene) stage.remove(activeScene)
    activeScene = scene
    stage.add(scene)
    bounds.setFromObject(scene).expandByPoint(origin).getBoundingSphere(sphere)
    radius = Math.max(sphere.radius, 0.1)
    grid.scale.setScalar(radius * 1.25)
    grid.position.y = -radius * .12
    fitPending = true
  }

  function reset() {
    fitPending = true
    schedule()
  }

  function draw(scene: Scene, los: LineOfSight, baseline: number, aspect: number) {
    setScene(scene)
    if (fitPending) {
      fitPending = false
      const verticalFov = camera.fov * Math.PI / 360
      const halfFov = Math.min(verticalFov, Math.atan(Math.tan(verticalFov) * aspect))
      const distance = radius * 1.1 / Math.sin(halfFov)
      controls.minDistance = radius * 0.04
      controls.maxDistance = Math.max(radius * 25, distance * 2)
      camera.near = Math.max(0.001, radius * 0.001)
      camera.far = Math.max(100, controls.maxDistance * 3)
      controls.target.copy(sphere.center)
      camera.position.copy(sphere.center).addScaledVector(orbitDirection, distance)
    }
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    controls.update()
    rig.update(los, baseline, radius)
    renderer.setRenderTarget(null)
    renderer.render(stage, camera)
  }

  return { setScene, draw, reset }
}
