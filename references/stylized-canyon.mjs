import {
  BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshBasicMaterial, Scene, SphereGeometry, Vector3,
} from 'three'

const halfTerrain = 56
const eyeHeight = 1.65
const sunlight = new Vector3(0.82, 0.58, 0.36).normalize()
const earth = new Color('#b18162')
const dune = new Color('#d3a077')
const adobe = new Color('#bf7656')
const scrub = new Color('#a99a59')
const soilShade = new Color('#766375')
const stoneShade = new Color('#41364f')
const distanceHaze = new Color('#8b8fb0')

const stacked = [
  [0.00, 1.06], [0.12, 1.02], [0.17, 0.93], [0.23, 0.66],
  [0.28, 0.72], [0.31, 0.89], [0.37, 0.91], [0.43, 0.85],
  [0.46, 0.68], [0.52, 0.62], [0.57, 0.77], [0.63, 0.79],
  [0.69, 0.71], [0.73, 0.58], [0.78, 0.57], [0.83, 0.63],
  [0.91, 0.62], [0.97, 0.53], [1.00, 0.36],
]
const mesa = [
  [0.00, 1.16], [0.18, 1.02], [0.35, 0.83], [0.52, 0.69],
  [0.66, 0.64], [0.72, 0.67], [0.75, 0.65], [0.89, 0.60],
  [0.98, 0.58], [1.00, 0.45],
]
const scree = [[0.00, 1.00], [0.26, 1.02], [0.75, 0.70], [1.00, 0.37]]
const strata = ['#ad5548', '#c5734f', '#dc8c61', '#aa5547', '#c46e51', '#d78458'].map((hex) => new Color(hex))

// Positions are [x, z] in metres, with −Z aimed toward the stacked sandstone.
const formations = [
  { name: 'North mesa', x: -8, z: -43, width: 21, depth: 10, height: 14.5, haze: 0.50, turn: 0.12, tiers: mesa, sides: 17 },
  { name: 'North eastern cliffs', x: 27, z: -45, width: 16, depth: 8, height: 12.8, haze: 0.62, turn: -0.12, tiers: mesa, sides: 13 },
  { name: 'Northern rampart', x: -36, z: -40, width: 14, depth: 11, height: 13.2, haze: 0.58, turn: 0.27, tiers: mesa, sides: 12 },
  { name: 'Eastern butte', x: 38, z: -10, width: 11, depth: 15, height: 9.6, haze: 0.40, turn: -0.51, tiers: mesa, sides: 12 },
  { name: 'South mesas', x: 13, z: 42, width: 28, depth: 9.5, height: 13.4, haze: 0.56, turn: 0.07, tiers: mesa, sides: 18 },
  { name: 'Western terraces', x: -38, z: 18, width: 12, depth: 19, height: 10.6, haze: 0.51, turn: -0.36, tiers: mesa, sides: 15 },
  { name: 'West sentinel', x: -18, z: 28, width: 5.8, depth: 4.5, height: 8.1, haze: 0.22, turn: 0.36, tiers: stacked, sides: 12 },
  { name: 'Southern pillar', x: 8.8, z: 16.5, width: 2.8, depth: 3.5, height: 5.8, haze: 0, turn: 0.53, tiers: stacked, sides: 11 },
  { name: 'Southern broken ledge', x: 14, z: 13, width: 4.9, depth: 2.9, height: 2.6, haze: 0, turn: 0.94, tiers: scree, sides: 9 },
  { name: 'East saddle rock', x: 18, z: 6, width: 5.7, depth: 2.9, height: 4.9, haze: 0.10, turn: 0.2, tiers: stacked, sides: 12 },
  { name: 'West layered rocks', x: -13, z: -6, width: 5.1, depth: 3, height: 3.3, haze: 0, turn: 1.03, tiers: stacked, sides: 11 },
  { name: 'Sandstone tower', x: -5.9, z: -18, width: 3.8, depth: 2.2, height: 7.1, haze: 0, turn: -0.11, tiers: stacked, sides: 13 },
  { name: 'Lower sandstone stack', x: 0.4, z: -20, width: 4, depth: 2.7, height: 5.3, haze: 0, turn: 0.27, tiers: stacked, sides: 12 },
  { name: 'Fallen sandstone slab', x: -0.8, z: -12, width: 2.6, depth: 1.1, height: 2.4, haze: 0, turn: -0.23, tiers: scree, sides: 7 },
  { name: 'Eastern boulder', x: 10, z: -13, width: 2.8, depth: 2, height: 3.1, haze: 0, turn: -0.41, tiers: scree, sides: 8 },
  { name: 'Isolated shard', x: 7.5, z: -15, width: 1.55, depth: 1.1, height: 2.3, haze: 0, turn: 0.64, tiers: scree, sides: 7 },
  { name: 'Near red slab', x: -3.1, z: -6.7, width: 1.45, depth: 0.74, height: 0.8, haze: 0, turn: 0.73, tiers: scree, sides: 7 },
]

function randomSequence(seed) {
  let state = seed
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function groundHeight(x, z) {
  const distance = Math.hypot(x, z)
  const relief = 0.48 * Math.sin(x * 0.15 - z * 0.18)
    + 0.14 * Math.sin(x * 0.49 + z * 0.31)
    + 1.3 * Math.exp(-((x + 28) ** 2 / 200 + (z + 14) ** 2 / 310))
    + 1.9 * Math.exp(-((x - 23) ** 2 / 180 + (z - 27) ** 2 / 100))
  const wash = x - 0.34 * z + 4.6 * Math.sin(z * 0.09)
  return -eyeHeight + clamp(distance / 10) * (relief - 0.48 * Math.exp(-(wash ** 2) / 13))
}

function createMeshBuilder() {
  const positions = []
  const colors = []
  const edge = new Vector3()
  const normal = new Vector3()
  return {
    face(points, getColor, getVertexColor) {
      normal.subVectors(points[1], points[0]).cross(edge.subVectors(points[2], points[0])).normalize()
      const color = getColor(normal)
      for (const point of points) {
        point.toArray(positions, positions.length)
        const shaded = getVertexColor ? getVertexColor(color, point) : color
        shaded.toArray(colors, colors.length)
      }
    },
    mesh(name, material) {
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
      const mesh = new Mesh(geometry, material)
      mesh.name = name
      return mesh
    },
  }
}

function shadeGround(color, point) {
  const { x, z } = point
  let shadow = 0
  for (const rock of formations) {
    const stretch = rock.height * 0.57
    const shadowX = rock.x - sunlight.x * stretch
    const shadowZ = rock.z - sunlight.z * stretch
    const distance = ((x - shadowX) / (rock.width + stretch * 0.75)) ** 2
      + ((z - shadowZ) / (rock.depth + stretch * 0.23)) ** 2
    shadow = Math.max(shadow, (1 - clamp((distance - 0.49) / 0.55)) * (0.65 - rock.haze * 0.34))
  }
  return color.clone().lerp(soilShade, shadow)
}

function createTerrain(random, material) {
  const segments = 74
  const step = halfTerrain * 2 / segments
  const rows = Array.from({ length: segments + 1 }, (_, row) =>
    Array.from({ length: segments + 1 }, (_, column) => {
      const x = -halfTerrain + step * (column + (column % segments ? (random() - 0.5) * 0.67 : 0))
      const z = -halfTerrain + step * (row + (row % segments ? (random() - 0.5) * 0.67 : 0))
      return new Vector3(x, groundHeight(x, z), z)
    }),
  )
  const builder = createMeshBuilder()

  function addGroundFace(points) {
    const [a, b, c] = points
    const x = (a.x + b.x + c.x) / 3
    const z = (a.z + b.z + c.z) / 3
    const washDistance = Math.abs(x - 0.34 * z + 4.6 * Math.sin(z * 0.09))
    const band = Math.sin(z * 0.32 + x * 0.1) * 0.2 + Math.sin(x * 0.10 - z * 0.083) * 0.2
    const color = earth.clone().lerp(dune, clamp(0.47 + band))
    const paleFloor = clamp((washDistance - 3.4) / 7)
    color.lerp(adobe, (1 - paleFloor) * 0.34)
    color.lerp(scrub, clamp(Math.sin(x * 0.21 + z * 0.13) * 0.62 - 0.15) * paleFloor)
    builder.face(points, (normal) => color.multiplyScalar(0.92 + 0.12 * normal.dot(sunlight) + random() * 0.10), shadeGround)
  }

  for (let row = 0; row < segments; row++) {
    for (let column = 0; column < segments; column++) {
      const a = rows[row][column]
      const b = rows[row + 1][column]
      const c = rows[row + 1][column + 1]
      const d = rows[row][column + 1]
      if ((row + column) % 2 === 0) {
        addGroundFace([a, b, c])
        addGroundFace([a, c, d])
      } else {
        addGroundFace([a, b, d])
        addGroundFace([b, c, d])
      }
    }
  }

  // Give the square an earthen edge when it is inspected from outside.
  const edges = [rows[0], rows.map((row) => row[segments]), [...rows[segments]].reverse(), rows.map((row) => row[0]).reverse()]
  for (const edge of edges) {
    for (let index = 1; index < edge.length; index++) {
      const a = edge[index - 1]
      const b = edge[index]
      const c = new Vector3(b.x, -5, b.z)
      const d = new Vector3(a.x, -5, a.z)
      const edgeColor = earth.clone().lerp(stoneShade, 0.25 + random() * 0.17)
      builder.face([a, b, c], () => edgeColor)
      builder.face([a, c, d], () => edgeColor)
    }
  }
  const a = new Vector3(-halfTerrain, -5, -halfTerrain)
  const b = new Vector3(-halfTerrain, -5, halfTerrain)
  const c = new Vector3(halfTerrain, -5, halfTerrain)
  const d = new Vector3(halfTerrain, -5, -halfTerrain)
  builder.face([a, c, b], () => soilShade)
  builder.face([a, d, c], () => soilShade)
  return builder.mesh('Square canyon terrain', material)
}

function addFormation(builder, random, { x, z, width, depth, height, haze, turn, tiers, sides }) {
  const base = groundHeight(x, z) - Math.min(1.15, height * 0.23)
  const outline = Array.from({ length: sides }, (_, index) => ({
    angle: index * Math.PI * 2 / sides + (random() - 0.5) * 0.3,
    radius: 0.78 + random() * 0.40,
    tilt: (random() - 0.5) * 0.09,
  }))
  const drift = random() - 0.5
  const lean = random() - 0.5
  const rings = tiers.map(([level, scale]) => {
    const offset = 0.96 + random() * 0.08
    return outline.map(({ angle, radius, tilt }) => {
      const reach = radius * scale * offset * (0.94 + random() * 0.12)
      const localX = width * (Math.cos(angle) * reach + drift * level * 0.42)
      const localZ = depth * (Math.sin(angle) * reach + lean * level * 0.35)
      return new Vector3(
        x + localX * Math.cos(turn) - localZ * Math.sin(turn),
        base + height * (level + tilt * Math.sin(level * Math.PI / 2)),
        z + localX * Math.sin(turn) + localZ * Math.cos(turn),
      )
    })
  })
  const tone = Math.floor(random() * strata.length)
  for (let level = 1; level < rings.length; level++) {
    const lower = rings[level - 1]
    const upper = rings[level]
    const layerColor = strata[(tone + Math.floor(level / 2)) % strata.length]
    for (let index = 0; index < sides; index++) {
      const next = (index + 1) % sides
      const color = layerColor.clone().lerp(dune, random() * 0.15)
      if (level > 1 && tiers[level][1] - tiers[level - 1][1] > 0.09) color.lerp(stoneShade, 0.20)
      function shadeStone(normal) {
        const lighting = clamp((normal.dot(sunlight) + 0.19) / 0.84)
        return color.clone().lerp(stoneShade, 0.73 * (1 - lighting))
          .lerp(distanceHaze, haze).multiplyScalar(0.92 + random() * 0.13)
      }
      builder.face([lower[index], upper[index], upper[next]], shadeStone)
      builder.face([lower[index], upper[next], lower[next]], shadeStone)
    }
  }
  const cap = rings[rings.length - 1]
  const foot = rings[0]
  const topCenter = cap.reduce((result, point) => result.add(point), new Vector3()).divideScalar(sides)
  const bottomCenter = foot.reduce((result, point) => result.add(point), new Vector3()).divideScalar(sides)
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides
    const topColor = dune.clone().lerp(strata[tone], 0.55).lerp(distanceHaze, haze).multiplyScalar(0.97 + random() * 0.09)
    builder.face([topCenter, cap[next], cap[index]], () => topColor)
    builder.face([bottomCenter, foot[index], foot[next]], () => stoneShade)
  }
}

function createScree(random, material) {
  const builder = createMeshBuilder()
  for (let index = 0; index < 180; index++) {
    const x = (random() - 0.5) * (halfTerrain * 2 - 5)
    const z = (random() - 0.5) * (halfTerrain * 2 - 5)
    const source = formations[index % formations.length]
    const alongCliffs = index % 4 !== 0
    const stoneX = alongCliffs ? source.x + (random() - 0.5) * (source.width * 2 + 15) : x
    const stoneZ = alongCliffs ? source.z + (random() - 0.5) * (source.depth * 2 + 13) : z
    if (Math.max(Math.abs(stoneX), Math.abs(stoneZ)) > halfTerrain - 1 || Math.hypot(stoneX, stoneZ) < 3.8) continue
    const size = 0.14 + random() ** 2.2 * 0.70
    addFormation(builder, random, {
      x: stoneX, z: stoneZ, width: size, depth: size * (0.5 + random() * 0.8), height: size * (0.38 + random() * 0.75),
      haze: 0.12, turn: random() * Math.PI, tiers: scree, sides: 5,
    })
  }
  return builder.mesh('Loose sandstone fragments', material)
}

function createScrub(random, material) {
  const builder = createMeshBuilder()
  const sunlit = new Color('#c4af65')
  const shaded = new Color('#82724e')
  for (let index = 0; index < 310; index++) {
    const x = (random() - 0.5) * (halfTerrain * 2 - 2)
    const z = (random() - 0.5) * (halfTerrain * 2 - 2)
    const wash = x - 0.34 * z + 4.6 * Math.sin(z * 0.09)
    if (Math.hypot(x, z) < 3.8 || (Math.abs(wash) < 4 && random() < 0.8)) continue
    if (formations.some((rock) => ((x - rock.x) / rock.width) ** 2 + ((z - rock.z) / rock.depth) ** 2 < 1.2)) continue
    const size = 0.12 + random() ** 1.7 * 0.42
    const y = groundHeight(x, z) - 0.11
    const clumpCount = 3 + Math.floor(random() * 3)
    for (let clump = 0; clump < clumpCount; clump++) {
      const heading = clump * Math.PI * 2 / clumpCount + random() * 0.6
      const radius = size * (0.21 + random() * 0.32)
      const stemX = x + size * 0.43 * Math.cos(heading)
      const stemZ = z + size * 0.43 * Math.sin(heading)
      const peak = new Vector3(stemX + radius * 0.28, y + size * (0.60 + random() * 0.55), stemZ)
      const feet = Array.from({ length: 4 }, (_, index) => {
        const angle = heading + index * Math.PI / 2
        return new Vector3(stemX + radius * Math.cos(angle), y, stemZ + radius * Math.sin(angle))
      })
      for (let index = 0; index < feet.length; index++) {
        builder.face([feet[index], peak, feet[(index + 1) % feet.length]], (normal) =>
          shaded.clone().lerp(sunlit, clamp(0.48 + normal.dot(sunlight) * 0.55)),
        )
      }
    }
  }
  return builder.mesh('Golden and olive desert scrub', material)
}

function createSky(material) {
  const geometry = new SphereGeometry(88, 56, 28).scale(-1, 1, 1)
  const zenith = new Color('#5798b8')
  const horizon = new Color('#a7c6cb')
  const haze = new Color('#c3a78d')
  const colors = []
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index++) {
    const altitude = positions.getY(index) / 88
    const color = horizon.clone().lerp(zenith, clamp(altitude * 2.5) ** 0.63)
    color.lerp(haze, clamp(-altitude * 5.5))
    color.toArray(colors, colors.length)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const sky = new Mesh(geometry, material)
  sky.name = 'CanyonSky'
  sky.userData.excludeFromInspectionBounds = true
  return sky
}

export function createStylizedCanyon() {
  const random = randomSequence(42)
  const scene = new Scene()
  scene.name = 'KumquatStylizedCanyon'
  const material = new MeshBasicMaterial({ vertexColors: true })
  material.name = 'Canyon painted colors'
  scene.add(createTerrain(random, material), createSky(material))
  for (const formation of formations) {
    const builder = createMeshBuilder()
    addFormation(builder, random, formation)
    scene.add(builder.mesh(formation.name, material))
  }
  scene.add(createScree(random, material), createScrub(random, material))
  return scene
}
