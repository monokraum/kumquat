import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three/webgpu'

export const IMAGE = { width: 1600, height: 1024, focal: 1645, cx: 799.5, cy: 511.5 }
export const FRAME = { width: 1920, height: 1080, x: 160, y: 28 }

export interface LineOfSight {
  yaw: number
  pitch: number
  roll: number
}

export function orientationFor({ yaw, pitch, roll }: LineOfSight) {
  const radians = MathUtils.degToRad
  return new Quaternion().setFromEuler(new Euler(radians(pitch), -radians(yaw), -radians(roll), 'YXZ'))
}

export function createReferenceCamera() {
  const verticalFov = MathUtils.radToDeg(2 * Math.atan(IMAGE.height / (2 * IMAGE.focal)))
  return new PerspectiveCamera(verticalFov, IMAGE.width / IMAGE.height, 0.01, 10_000)
}

export const FACES = [
  { forward: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0) },
  { forward: new Vector3(-1, 0, 0), up: new Vector3(0, 1, 0) },
  { forward: new Vector3(0, 1, 0), up: new Vector3(0, 0, 1) },
  { forward: new Vector3(0, -1, 0), up: new Vector3(0, 0, -1) },
  { forward: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
  { forward: new Vector3(0, 0, -1), up: new Vector3(0, 1, 0) },
].map(({ forward, up }) => ({ forward, up, right: forward.clone().cross(up) }))
