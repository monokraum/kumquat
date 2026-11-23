import { writeFile } from 'node:fs/promises'
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Scene,
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
  new MeshBasicMaterial({ color: 0x649dff }),
)
farObject.name = 'far_octahedron'
farObject.position.set(2.4, -0.85, -10)
scene.add(farObject)

const glb = await new GLTFExporter().parseAsync(scene, { binary: true })
await writeFile(new URL('./reference-scene.glb', import.meta.url), new Uint8Array(glb))
