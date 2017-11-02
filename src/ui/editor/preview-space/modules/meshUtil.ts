
function clearScene(scene: THREE.Scene) {
  scene.traverse(mesh => {
    if (mesh instanceof THREE.Mesh) {
        cleanMeshMemory(mesh);
        mesh.material = null;
        mesh.geometry = null;
        if (mesh.material instanceof THREE.MeshLambertMaterial) {
          if (mesh.material.map instanceof THREE.Texture) {
            mesh.material.map = null; //texture
          }
        }
        mesh = null;
      }
  });
  scene.children.forEach(mesh => scene.remove(mesh));
}

function cleanMeshMemory(mesh: THREE.Mesh) {
  if (!mesh) return;
  if (mesh.material) mesh.material.dispose();
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material && mesh.material instanceof THREE.MeshLambertMaterial) {
    if (mesh.material.map instanceof THREE.Texture) {
      mesh.material.map.dispose();
    }
  }
}

export {clearScene, cleanMeshMemory};
