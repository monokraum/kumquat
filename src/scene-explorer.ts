import {
  Box3, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, GridHelper, Group, InstancedMesh, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SkinnedMesh, Sphere, SphereGeometry, Vector3,
} from 'three/webgpu'
import type { Object3D, WebGPURenderer } from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { eyeOffset, imageBorderRays, orientationFor } from './camera'
import type { LineOfSight } from './camera'
import { createSceneWalkControls } from './scene-walk-controls'

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

function getInspectionBounds(scene: Scene, helpers: Object3D[]) {
  const bounds = new Box3()
  if (!helpers.length) return bounds.setFromObject(scene)

  const localBounds = new Box3()
  function include(object: Object3D) {
    if (object.userData.excludeFromInspectionBounds === true) return
    if (object instanceof SkinnedMesh || object instanceof InstancedMesh) {
      if (!object.boundingBox) object.computeBoundingBox()
      if (object.boundingBox) bounds.union(localBounds.copy(object.boundingBox).applyMatrix4(object.matrixWorld))
    } else if ('geometry' in object && object.geometry instanceof BufferGeometry) {
      const geometry = object.geometry
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      if (geometry.boundingBox) bounds.union(localBounds.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld))
    }
    object.children.forEach(include)
  }

  scene.updateWorldMatrix(true, true)
  include(scene)
  return bounds
}

export function createSceneExplorer(
  renderer: WebGPURenderer, viewport: HTMLElement, schedule: () => void, onWalkModeChange: (walking: boolean) => void,
) {
  const stage = new Scene()
  stage.background = new Color('#0c121e')
  const camera = new PerspectiveCamera(43, 1, 0.01, 10_000)
  const controls = new OrbitControls(camera, viewport)
  controls.listenToKeyEvents(viewport)
  controls.addEventListener('change', schedule)
  controls.enabled = false
  const walkCamera = new PerspectiveCamera(camera.fov, 1, 0.03, 10_000)
  const walkControls = createSceneWalkControls(walkCamera, viewport, schedule)
  const grid = new GridHelper(2, 24, 0x526073, 0x263140)
  const rig = createCameraRig()
  stage.add(grid, rig.group)

  const sphere = new Sphere()
  let activeScene: Scene | undefined
  let inspectionHelpers: Object3D[] = []
  let radius = 1
  let fitPending = true
  let active = false
  let walking = false

  function setActive(value: boolean) {
    active = value
    controls.enabled = active && !walking
    walkControls.setEnabled(active && walking)
  }

  function setWalking(value: boolean) {
    if (walking === value) return
    walking = value
    if (walking) walkControls.reset()
    setActive(active)
    grid.visible = rig.group.visible = !walking
    onWalkModeChange(walking)
    schedule()
  }

  function setScene(scene: Scene) {
    if (activeScene === scene) return
    if (activeScene) stage.remove(activeScene)
    activeScene = scene
    stage.add(scene)
    inspectionHelpers = []
    scene.traverse((object) => {
      if (object.userData.excludeFromInspectionBounds === true) inspectionHelpers.push(object)
    })
    getInspectionBounds(scene, inspectionHelpers).expandByPoint(origin).getBoundingSphere(sphere)
    radius = Math.max(sphere.radius, 0.1)
    grid.scale.setScalar(radius * 1.25)
    grid.position.y = -radius * .12
    fitPending = true
    setWalking(false)
  }

  function reset() {
    if (walking) walkControls.reset()
    else fitPending = true
    schedule()
  }

  function draw(scene: Scene, los: LineOfSight, baseline: number, aspect: number) {
    setScene(scene)
    renderer.setRenderTarget(null)
    if (walking) {
      walkControls.update()
      walkCamera.aspect = aspect
      walkCamera.updateProjectionMatrix()
      renderer.render(stage, walkCamera)
      return
    }

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
    const hidden = inspectionHelpers.filter(({ visible }) => visible)
    hidden.forEach((object) => { object.visible = false })
    try {
      renderer.render(stage, camera)
    } finally {
      hidden.forEach((object) => { object.visible = true })
    }
  }

  return { setScene, setActive, setWalking, draw, reset }
}
