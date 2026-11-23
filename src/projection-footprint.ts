import { Vector3 } from 'three/webgpu'
import { FACES, IMAGE, orientationFor } from './camera'
import type { LineOfSight } from './camera'
import { CUBE_CROSS, PREVIEW_FACE_SIZE, PREVIEW_HEIGHT, PREVIEW_WIDTH } from './projection-layout'
import type { Projection } from './projection-layout'

interface Point {
  x: number
  y: number
}

const edgeRays = [
  [-0.5, -0.5],
  [IMAGE.width - 0.5, -0.5],
  [IMAGE.width - 0.5, IMAGE.height - 0.5],
  [-0.5, IMAGE.height - 0.5],
].map(([x, y]) => new Vector3((x - IMAGE.cx) / IMAGE.focal, (IMAGE.cy - y) / IMAGE.focal, -1))

function cubemapEdge(start: Vector3, end: Vector3, faceIndex: number): Point[] {
  const { forward, right, up } = FACES[faceIndex]
  const { column, row } = CUBE_CROSS[faceIndex]
  const frontStart = start.dot(forward)
  const frontEnd = end.dot(forward)
  let enter = 0
  let exit = 1

  // A ray belongs to this face when its forward component dominates both side components.
  for (const axis of [right, up]) {
    for (const sign of [-1, 1]) {
      const a = frontStart + sign * start.dot(axis)
      const b = frontEnd + sign * end.dot(axis)
      if (a < 0 && b < 0) return []
      if (a < 0) enter = Math.max(enter, a / (a - b))
      else if (b < 0) exit = Math.min(exit, a / (a - b))
    }
  }
  if (enter >= exit) return []

  return [enter, exit].map((t) => {
    const ray = new Vector3().lerpVectors(start, end, t)
    const depth = ray.dot(forward)
    return {
      x: (column + (ray.dot(right) / depth + 1) / 2) * PREVIEW_FACE_SIZE,
      y: (row + (1 - ray.dot(up) / depth) / 2) * PREVIEW_FACE_SIZE,
    }
  })
}

function panoramaEdges(start: Vector3, end: Vector3): Point[][] {
  const delta = new Vector3().subVectors(end, start)
  const horizontalLengthSquared = delta.x * delta.x + delta.z * delta.z
  const closest = -(start.x * delta.x + start.z * delta.z) / horizontalLengthSquared
  // Splitting at the minimum horizontal radius separates both approaches to a pole.
  const intervals = closest > 0 && closest < 1 ? [[0, closest], [closest, 1]] : [[0, 1]]
  const ray = new Vector3()

  function project(t: number, side: number): Point {
    ray.copy(start).addScaledVector(delta, t)
    const radius = Math.hypot(ray.x, ray.z)
    const longitude = radius < 1e-12
      ? Math.atan2(side * delta.x, -side * delta.z)
      : Math.atan2(ray.x, -ray.z)
    return {
      x: 0.5 + longitude / (2 * Math.PI),
      y: 0.5 - Math.atan2(ray.y, radius) / Math.PI,
    }
  }

  return intervals.flatMap(([from, to]) => {
    const first = project(from, 1)
    const last = project(to, -1)
    last.x += Math.round(first.x - last.x)
    const path = [first]

    function refine(left: number, a: Point, right: number, b: Point, depth: number) {
      const t = (left + right) / 2
      const midpoint = project(t, 1)
      const linearX = (a.x + b.x) / 2
      midpoint.x += Math.round(linearX - midpoint.x)
      const error = Math.hypot(
        (midpoint.x - linearX) * PREVIEW_WIDTH,
        (midpoint.y - (a.y + b.y) / 2) * PREVIEW_HEIGHT.equirectangular,
      )
      if (error > 0.35 && depth < 12) {
        refine(left, a, t, midpoint, depth + 1)
        refine(t, midpoint, right, b, depth + 1)
      } else {
        path.push(b)
      }
    }
    refine(from, first, to, last, 0)

    // The canvas clips each copy at its edge, so a seam crossing keeps both visible halves.
    return [-1, 0, 1].map((offset) => path.map(({ x, y }) => ({
      x: (x + offset) * PREVIEW_WIDTH,
      y: y * PREVIEW_HEIGHT.equirectangular,
    })))
  })
}

export function projectionFootprint(projection: Projection, los: LineOfSight): Point[][] {
  const rotation = orientationFor(los)
  const rays = edgeRays.map((ray) => ray.clone().applyQuaternion(rotation))
  return rays.flatMap((start, index) => {
    const end = rays[(index + 1) % rays.length]
    return projection === 'cubemap'
      ? FACES.map((_, faceIndex) => cubemapEdge(start, end, faceIndex)).filter((segment) => segment.length)
      : panoramaEdges(start, end)
  })
}
