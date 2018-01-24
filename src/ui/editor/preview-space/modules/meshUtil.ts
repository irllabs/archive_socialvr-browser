import * as THREE from 'three';

function clearScene(scene: THREE.Scene) {
  scene.traverse(mesh => {
    if (mesh instanceof THREE.Mesh) {
      cleanMeshMemory(mesh);
      if (mesh.material && mesh.material.map) {
        mesh.material.map = null;
      }
      mesh.material = null;
      mesh.geometry = null;
      mesh = null;
    }
  });
  scene.children.forEach(mesh => scene.remove(mesh));
}

function cleanMeshMemory(mesh) {
  console.log("cleanMeshMemory", mesh);
  if (!mesh) return;
  if (mesh.material && mesh.material.map) {
    console.log('clean mesh texture');
    mesh.material.map.dispose();
    mesh.material.map = undefined;
  }
  if (mesh.material) {
    console.log('clean mesh material');
    mesh.material.dispose();
    mesh.material = undefined;
  }
  if (mesh.geometry) {
    console.log('clean mesh geometry');
    mesh.geometry.dispose();
    mesh.geometry = undefined;
  }
}

export {clearScene, cleanMeshMemory};
