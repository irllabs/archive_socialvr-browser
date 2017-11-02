export default class IdMeshPair {
  id: string;
  isHotspot: boolean
  mesh: THREE.Mesh;
  constructor(id: string, isHotspot: boolean, mesh: THREE.Mesh) {
    this.id = id;
    this.isHotspot = isHotspot;
    this.mesh = mesh;
  }
}
