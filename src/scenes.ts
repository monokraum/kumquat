import { AmbientLight, Color, DirectionalLight, LoadingManager, Mesh, Scene, Texture } from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import referenceUrl from '../fixtures/reference-scene/reference-scene.glb?url'

export async function referenceBytes() {
  const response = await fetch(referenceUrl)
  if (!response.ok) throw new Error('Le GLB de référence est indisponible.')
  return response.arrayBuffer()
}

export async function readScene(bytes: ArrayBuffer) {
  if (bytes.byteLength < 12 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) {
    throw new Error('Le fichier doit être au format .glb.')
  }

  const manager = new LoadingManager()
  manager.setURLModifier((url) => {
    if (url.startsWith('blob:') || url.startsWith('data:')) return url
    throw new Error('Le GLB doit contenir ses ressources pour être chargé hors ligne.')
  })

  const gltf = await new GLTFLoader(manager).parseAsync(bytes, '')
  const scene = new Scene()
  scene.background = new Color('#172332')
  const key = new DirectionalLight(0xffffff, 2)
  key.position.set(3, 5, 4)
  scene.add(gltf.scene, new AmbientLight(0xffffff, 1), key)
  return scene
}

export function disposeScene(scene: Scene) {
  const materials = new Set<import('three/webgpu').Material>()
  const textures = new Set<Texture>()
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
    meshMaterials.forEach((material) => materials.add(material))
  })
  materials.forEach((material) => {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value)
    }
    material.dispose()
  })
  textures.forEach((texture) => {
    texture.dispose()
    if (texture.image instanceof ImageBitmap) texture.image.close()
  })
}
