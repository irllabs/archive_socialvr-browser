import {THREE_CONST} from 'ui/common/constants';

// This file contains common 3D logic for edit-space-sphere and preview-space

const SPHERE_RADIUS: number = THREE_CONST.SPHERE_RADIUS;
const NUM_SPHERE_SLICES: number = THREE_CONST.SPHERE_SLICES;
const RADIAL_DISTANCE: number = THREE_CONST.RADIAL_DISTANCE;


export function buildScene() {
  const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, NUM_SPHERE_SLICES, NUM_SPHERE_SLICES);
  const widthHeightRatio: number = window.innerWidth / window.innerHeight;
  const sphereMesh = new THREE.Mesh(sphereGeometry);
  const camera = new THREE.PerspectiveCamera(THREE_CONST.FOV_NORM, widthHeightRatio, 1, SPHERE_RADIUS * 2);
  const vrCamera = new THREE.PerspectiveCamera(THREE_CONST.FOV_NORM, widthHeightRatio, 1, SPHERE_RADIUS * 2);
  const scene = new THREE.Scene();

  sphereMesh.scale.set(1, 1, 1); // AHHHHH
  sphereMesh.name = 'sphereMesh';
  camera.aspect = widthHeightRatio;
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 0.0001;
  vrCamera.aspect = widthHeightRatio;
  vrCamera.position.x = 0;
  vrCamera.position.y = 0;
  vrCamera.position.z = 0.0001;
  scene.add(camera);
  scene.add(vrCamera);
  scene.add(sphereMesh);

  return { sphereMesh, camera, vrCamera, scene };
}

export function onResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const DPR: number = window.devicePixelRatio || 1;
      const rendererWidth = window.innerWidth / DPR;
      const rendererHeight = window.innerHeight / DPR;
      const aspectRatio = rendererWidth / rendererHeight;
      renderer.setPixelRatio(DPR);
      renderer.setSize(rendererWidth, rendererHeight, false);
      camera.aspect = aspectRatio;
      camera.updateProjectionMatrix();
      setTimeout(() => resolve());
    }
    catch (error) {
      reject(error);
    }
  });
}
