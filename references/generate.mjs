import { writeFile } from 'node:fs/promises'
import {
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  PointLight,
  Scene,
  SphereGeometry,
  TorusKnotGeometry,
  Vector3,
} from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

// The texture-free binary export reads its generated blobs through FileReader.
globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer()
    this.onloadend?.()
  }
}

const origin = new Vector3()
const scene = new Scene()
scene.name = 'KumquatReference'

const white = new MeshBasicMaterial({ color: 0xffffff })
const charcoal = new MeshBasicMaterial({ color: 0x141b26 })

function addDirectional(targetScene, name, color, intensity, position, aim) {
  const light = new DirectionalLight(color, intensity)
  light.name = name
  light.position.set(...position)
  light.lookAt(new Vector3(...aim))
  // glTF stores directional lights pointing along the node's local -Z axis.
  light.target.position.set(0, 0, -1)
  light.add(light.target)
  targetScene.add(light)
}

function addPanel(name, position, color, markCount) {
  const panel = new Group()
  panel.name = name
  panel.position.set(...position)

  // A different up vector keeps the pole panels' roll well-defined.
  if (position[0] === 0 && position[2] === 0) {
    panel.up.set(0, 0, 1)
  }
  panel.lookAt(origin)
  scene.add(panel)

  const accent = new MeshBasicMaterial({ color })

  function addRectangle(part, width, height, x, y, material, z = 0.005) {
    const mesh = new Mesh(new PlaneGeometry(width, height), material)
    mesh.name = `${name}_${part}`
    mesh.position.set(x, y, z)
    panel.add(mesh)
  }

  addRectangle('board', 1.8, 1.35, 0, 0, charcoal, 0)
  addRectangle('cap', 1.8, 0.18, 0, 0.58, accent)
  addRectangle('fiducial_horizontal', 0.34, 0.045, 0, 0, white)
  addRectangle('fiducial_vertical_top', 0.045, 0.15, 0, 0.0975, white)
  addRectangle('fiducial_vertical_bottom', 0.045, 0.15, 0, -0.0975, white)
  addRectangle('orientation_corner', 0.17, 0.17, -0.64, 0.30, accent)

  for (let index = 0; index < markCount; index += 1) {
    addRectangle(`mark_${index + 1}`, 0.095, 0.15, -0.66 + index * 0.18, -0.43, white)
  }
}

addPanel('axis_negative_z_front', [0, 0, -8], 0x49d6c5, 1)
addPanel('axis_positive_x_right', [8, 0, 0], 0xf4b044, 2)
addPanel('axis_positive_z_back_seam', [0, 0, 8], 0xd87cf1, 3)
addPanel('axis_negative_x_left', [-8, 0, 0], 0x649dff, 4)
addPanel('axis_positive_y_up', [0, 8, 0], 0xc5e45c, 5)
addPanel('axis_negative_y_down', [0, -8, 0], 0xff735d, 6)
addPanel('cubemap_edge_positive_x_negative_z', [6, 0, -6], 0xffffff, 7)

const nearObject = new Mesh(
  new BoxGeometry(0.30, 0.34, 0.25),
  new MeshBasicMaterial({ color: 0xf4b044 }),
)
nearObject.name = 'near_box'
nearObject.position.set(-0.62, -0.43, -2.5)
nearObject.rotation.y = Math.PI / 6
scene.add(nearObject)

const farObject = new Mesh(
  new OctahedronGeometry(0.68),
  new MeshStandardMaterial({ color: 0x649dff, roughness: 0.55 }),
)
farObject.name = 'far_octahedron'
farObject.position.set(2.4, -0.85, -10)
scene.add(farObject)

addDirectional(scene, 'calibration_key', 0xffeee0, 2.7, [-3, 5, 0], [0, 0, -7])
addDirectional(scene, 'calibration_fill', 0xc4d9ff, 1.15, [4, 1, -6], [0, 0, -8])

const studio = new Scene()
studio.name = 'KumquatLightingStudio'

function addStudioMesh(name, geometry, position, material) {
  const mesh = new Mesh(geometry, new MeshStandardMaterial(material))
  mesh.name = name
  mesh.position.set(...position)
  studio.add(mesh)
  return mesh
}

const floor = addStudioMesh('studio_floor', new PlaneGeometry(13, 16), [0, -1.05, -7], {
  color: 0xb0b7c6, roughness: 0.83,
})
floor.rotation.x = -Math.PI / 2
addStudioMesh('studio_backdrop', new BoxGeometry(10, 4.6, 0.12), [0, 1.15, -8.7], {
  color: 0x344960, roughness: 0.9,
})
addStudioMesh('matte_clay_sphere', new SphereGeometry(0.56, 40, 24), [-1.32, -0.49, -4.7], {
  color: 0xed865b, roughness: 0.76,
})
addStudioMesh('studio_plinth', new CylinderGeometry(0.62, 0.67, 0.28, 48), [0, -0.91, -5.45], {
  color: 0x384550, roughness: 0.58,
})
const knot = addStudioMesh('glazed_torus_knot', new TorusKnotGeometry(0.49, 0.16, 112, 16), [0, 0, -5.45], {
  color: 0x49c7ba, roughness: 0.28, metalness: 0.28,
})
knot.rotation.set(0.4, 0.4, -0.2)
const block = addStudioMesh('satin_blue_block', new BoxGeometry(1, 1.12, 0.78), [1.55, -0.49, -5.9], {
  color: 0x7993dd, roughness: 0.36,
})
block.rotation.y = -0.45
addStudioMesh('near_occluder', new BoxGeometry(0.32, 0.62, 0.34), [0.63, -0.74, -3.15], {
  color: 0x91466d, roughness: 0.68,
})

addDirectional(studio, 'studio_warm_key', 0xfff0df, 2.8, [-3.4, 4.5, -1.6], [0, -0.3, -5.6])
addDirectional(studio, 'studio_cool_fill', 0xa9caff, 1.2, [4.2, 2.4, -2.9], [0, -0.35, -5.5])
const accent = new PointLight(0xd9fff6, 18, 8)
accent.name = 'studio_point_accent'
accent.position.set(-0.25, 1.4, -6.2)
studio.add(accent)

async function writeGlb(source, filename) {
  const glb = await new GLTFExporter().parseAsync(source, { binary: true })
  await writeFile(new URL(filename, import.meta.url), new Uint8Array(glb))
}

await writeGlb(scene, './reference-scene.glb')
await writeGlb(studio, './studio-eclaire.glb')
