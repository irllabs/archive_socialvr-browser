import { Mesh } from 'three';

export default class IdMeshPair {
  id: string;
  isHotspot: boolean;
  mesh: Mesh;

  constructor(id: string, isHotspot: boolean, mesh: Mesh) {
    this.id = id;
    this.isHotspot = isHotspot;
    this.mesh = mesh;
  }
}
