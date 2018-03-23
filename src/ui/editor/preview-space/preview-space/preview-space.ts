import {Component, NgZone, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import * as THREE from 'three';

import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {CameraInteractor} from 'core/scene/cameraInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
// import {MultiViewService} from 'ui/editor/preview-space/modules/multiViewService';
import * as MeshUtil from 'ui/editor/preview-space/modules/meshUtil';
import {AudioManager} from 'ui/editor/preview-space/modules/audioManager';
import {TextureLoader} from 'ui/editor/preview-space/modules/textureLoader';
import IdMeshPair from 'ui/editor/preview-space/modules/idMeshPair';
import {HotspotManager} from 'ui/editor/preview-space/modules/hotspotManager';
import {MenuManager} from 'ui/editor/preview-space/modules/menuManager';
import {Reticle} from 'ui/editor/preview-space/modules/reticle';
import {Room} from 'data/scene/entities/room';
import {Video3D} from 'ui/editor/edit-space/video3D';
import {buildScene} from 'ui/editor/util/threeUtil';
import SvrControls from 'ui/editor/util/SvrControls';
import {THREE_CONST} from 'ui/common/constants';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';

const Stats = require('stats.js')
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const TWEEN = require('@tweenjs/tween.js');
const roomSphereFragShader = require('ui/editor/util/shaders/roomSphere.frag');
const roomSphereVertShader = require('ui/editor/util/shaders/roomSphere.vert');

@Component({
  selector: 'preview-space',
  styleUrls: ['./preview-space.scss'],
  templateUrl: './preview-space.html',
})
export class PreviewSpace {

  @ViewChild('previewCanvas') previewCanvasWrapper;
  @ViewChild('vrCanvas') vrCanvasWrapper;

  private renderer: THREE.WebGLRenderer;
  private vrRenderer: THREE.WEbGLRenderer;
  private svrControls: SvrControls;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vrCamera: THREE.PerspectiveCamera;
  private sphereMesh: THREE.Mesh;
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private vrDisplay: VRDisplay;
  private isInRenderLoop: boolean = false;
  private activateHotspotTimeout: number;
  private showVrModeButton: boolean = false;
  private video3D: Video3D;
  private animationRequest: number;
  private lastRenderTime: number = performance.now();
  private meshList: THREE.Mesh[] = [];
  private roomHistory: string[] = [];
  private shouldInit: boolean = false;
  private inRoomTween: boolean = false;
  private lookAtVector: THREE.Vector3;
  private sphereMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({map: null, side: THREE.BackSide});
  private onResizeFn: Function = this.onResize.bind(this);
  private onVrDisplayChangeFn: Function = this.onVrDisplayChange.bind(this);
  private vrHasBeenSetUp: boolean = false;

  constructor(
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private cameraInteractor: CameraInteractor,
    private ngZone: NgZone,
    private assetInteractor: AssetInteractor,
    private route: ActivatedRoute,
    private router: Router,
    private audioManager: AudioManager,
    private textureLoader: TextureLoader,
    private hotspotManager: HotspotManager,
    private menuManager: MenuManager,
    private reticle: Reticle
  ) {}


  //////////////////////////////////////////////
  ///////////    HOUSE KEEPING    //////////////
  //////////////////////////////////////////////

  ngOnInit() {
    const projectIsEmpty = this.metaDataInteractor.projectIsEmpty();
    const isMultiView = this.router.url.includes('multiview=');
    if (projectIsEmpty && !isMultiView) {
      this.router.navigate(['/editor', {outlets: {'view': 'flat'}}]);
      return;
    }
    this.shouldInit = true;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResizeFn, false);
      window.addEventListener('vrdisplaypresentchange', this.onVrDisplayChangeFn, false);
    });
  }

  ngAfterViewInit() {
    if (!this.shouldInit) return;
    this.initScene();
    Promise.all([
      this.audioManager.loadBuffers(),
      this.textureLoader.load(),
      this.initVrDisplay(),
      fontHelper.load(),
    ])
    .then(() => {
      this.initRoom();
      this.onResize(null);
    })
    .catch(error => console.log('EditSphereBaseInit', error));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResizeFn, false);
    window.removeEventListener('vrdisplaypresentchange', this.onVrDisplayChangeFn, false);
    this.cameraInteractor.setCameraAngles(this.svrControls.getCameraAngles());
    this.stopAnimationLoop(0).then(() => console.log('animation loop stopped'));
    this.renderer.dispose();
    this.vrRenderer.dispose();
    this.svrControls.dispose();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.audioManager.stopAllAudio();
    if (!!this.video3D) {
      this.video3D.destroy();
    }
    this.hotspotManager.cleanMaps(this.scene);
    this.menuManager.destroy();
    if (this.scene) {
      MeshUtil.clearScene(this.scene);
    }
  }


  //////////////////////////////////////////////
  ///////////  INITIALIZATION     //////////////
  //////////////////////////////////////////////


  private initScene() {
    const previewCanvas = this.previewCanvasWrapper.nativeElement;
    const vrCanvas = this.vrCanvasWrapper.nativeElement;
    const scenePrimitives = buildScene();
    this.sphereMesh = scenePrimitives.sphereMesh;
    this.camera = scenePrimitives.camera;
    this.vrCamera = scenePrimitives.vrCamera;
    this.scene = scenePrimitives.scene;
    this.sphereMesh.material = this.sphereMaterial;

    this.reticle.init(this.camera, this.vrCamera);
    this.renderer = new THREE.WebGLRenderer({canvas: previewCanvas, antialias: false});
    this.vrRenderer = new THREE.WebGLRenderer({canvas: vrCanvas, antialias: true});
    this.vrRenderer.vr.enabled = true;
		this.vrRenderer.vr.userHeight = 0; // TOFIX
    this.svrControls = new SvrControls({
      camera: this.camera,
      domElement: previewCanvas,
      initialCameraAngles: this.cameraInteractor.getCameraAngles(),
      executionContext: this.ngZone.runOutsideAngular.bind(this.ngZone)
    });
  }

  initRoom() {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);
    this.sphereMesh.position.set(0,0,0);
    room.getBackgroundIsVideo() ? this.init3dRoom(room) : this.init2dRoom(roomId);
    this.audioManager.stopAllAudio();
    this.audioManager.playBackgroundAudio();
    this.audioManager.playNarration();
    this.audioManager.playSoundtrack();
    this.roomHistory.push(roomId);
  }

  //for still image backgrounds
  private init2dRoom(roomId: string) {
    const sphereTexture = this.assetInteractor.getTextureById(roomId);

    // console.log('shaders', roomSphereFragShader, roomSphereVertShader);
    // this.sphereMesh.material = new THREE.ShaderMaterial({
    //   wireframe: true,
    //   uniforms: {
    //     time: {
    //       type: 'f',
    //       value: 0
    //     },
    //     texture: {
    //       type: 't',
    //       value: sphereTexture
    //     }
    //   },
    //   vertexShader: roomSphereVertShader,
    //   fragmentShader: roomSphereFragShader,
    //   side: THREE.FrontSide
    // });
    if (this.sphereMesh.material.map) {
      this.sphereMesh.material.map.dispose();
    }
    this.sphereMesh.material.map = sphereTexture;
    this.hotspotManager.load(this.scene, this.camera, this.goToRoom.bind(this));

    if(!this.menuManager.exists()) {
      this.menuManager.load(this.scene, this.camera.position, this.goToLastRoom.bind(this),this.goToHomeRoom.bind(this));
    }
  }

  //for video backgrounds
  private init3dRoom(room: Room) {
    this.video3D = new Video3D();
    this.video3D.init(room.getBackgroundVideo())
      .then(texture => {
        this.sphereMesh.material = new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide});
        this.hotspotManager.load(this.scene, this.camera, this.goToRoom.bind(this));
        this.menuManager.load(this.scene, this.camera.position, this.goToLastRoom.bind(this),this.goToHomeRoom.bind(this));
        this.onResize(null);
      })
      .catch(error => console.log('EditSpaceSphere.initVideo', error));
  }

  //////////////////////////////////////////////
  /////// animate, update, render //////////////
  //////////////////////////////////////////////

  private startAnimationLoop() {
    this.isInRenderLoop = true;
    console.log('startAnimationLoop', this.vrDisplayIsActive())
    this.vrDisplayIsActive() ?
      this.vrRenderer.animate(this.animate.bind(this)) :
      this.animate();
  }

  private stopAnimationLoop(timeout) {
    return new Promise((resolve, reject) => {
      this.isInRenderLoop = false;
      cancelAnimationFrame(this.animationRequest);
      this.vrRenderer.animate(null);
      setTimeout(() => resolve(), timeout);
    });
  }

  private animate() {
    if (!this.isInRenderLoop) {
      return;
    }
    stats.begin();
    this.ngZone.runOutsideAngular(() => {
      // calculate elapsed time
      const timestamp = performance.now();
      const elapsedTime = timestamp - this.lastRenderTime;
      this.lastRenderTime = timestamp;
      // update and render
      this.update(elapsedTime);
      this.render();
    });
  }

  private update(elapsedTime: number) {
    const isInVrMode = this.vrDisplayIsActive();
    const reticle = this.reticle.getActiveReticle(isInVrMode);
    const camera = this.vrDisplayIsActive() ? this.vrCamera : this.camera;
    if (!isInVrMode) {
      this.svrControls.update();
    }
    if (!this.inRoomTween) {this.hotspotManager.update(reticle, elapsedTime);}
    this.menuManager.update(reticle, camera);
    this.reticle.showVrReticle(isInVrMode);
    // this.multiViewService.update(camera);
    TWEEN.update();
  }

  private render() {
    if (this.vrDisplayIsActive()) {
      this.vrRenderer.render(this.scene, this.vrCamera);
    }
    else {
      this.renderer.render(this.scene, this.camera);
      cancelAnimationFrame(this.animationRequest);
      this.animationRequest = requestAnimationFrame(this.animate.bind(this));
    }
    stats.end();
  }

  //////////////////////////////////////////////
  /////// Room Changing Helpers ////////////////
  //////////////////////////////////////////////

  goToLastRoom() {
    this.roomHistory.pop();
    var lastRoom =   this.roomHistory[this.roomHistory.length-1];
    setTimeout(()=>{
       this.sceneInteractor.setActiveRoomId(lastRoom);
       this.initRoom();
    });
  }

  goToHomeRoom() {
    var homeRoom = this.sceneInteractor.getHomeRoomId();
    this.sceneInteractor.setActiveRoomId(homeRoom);
    this.initRoom();
  }

  goToRoom(outgoingRoomId) {
    this.inRoomTween = true;
    this.lookAtVector = new THREE.Vector3(0,0,0);
    //get the direciton we should move in
    if (this.vrDisplayIsActive()) {
      this.vrCamera.getWorldDirection( this.lookAtVector );
    } else {
      this.camera.getWorldDirection( this.lookAtVector );
    }

    //tween with sphere position
    var tweenRoomOut = new TWEEN.Tween(this.sphereMesh.position).to({
        x: -1 * this.lookAtVector.x * THREE_CONST.TWEEN_ROOM_MOVE,
        y: -1 * this.lookAtVector.y * THREE_CONST.TWEEN_ROOM_MOVE,
        z: -1 * this.lookAtVector.z * THREE_CONST.TWEEN_ROOM_MOVE
    },THREE_CONST.TWEEN_ROOM_MOVETIMEIN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {

    }).onComplete( () => {
      this.inRoomTween = false;
      this.sceneInteractor.setActiveRoomId(outgoingRoomId);
      this.initRoom();
    }).start();
  }

  //////////////////////////////////////////////
  //////////////   VR MODE      ////////////////
  //////////////////////////////////////////////

  private requestVrMode($event) {
    console.log('requestVrMode', this.vrRenderer.domElement)
    this.vrDisplay.requestPresent([{source: this.vrRenderer.domElement}])
      .then(() => console.log('vrModeGranted'))
      .catch(error => console.log('requestVRMode error', error));
  }


  private initVrDisplay(): Promise<any> {
    return navigator.getVRDisplays()
      .then(vrDisplayList => {
        if (vrDisplayList.length > 0) {
          this.vrDisplay = vrDisplayList[0];
          this.vrRenderer.vr.setDevice(this.vrDisplay);
          console.log('vrDisplay', this.vrDisplay);
          this.showVrModeButton = this.vrDisplay.capabilities.canPresent;
        }
      })
      .catch(error => console.log('initVrDisplay', error));
  }

  private vrDisplayIsActive(): boolean {
    return !!this.vrDisplay && !!this.vrDisplay.isPresenting;
  }

  private showVrElement(showVrElement: boolean) {
    this.renderer.domElement.style.setProperty('display', showVrElement ? 'none' : 'block');
    this.vrRenderer.domElement.style.setProperty('display', showVrElement ? 'block' : 'none');
  }

  //////////////////////////////////////////////
  //////////////   EVENTS ETC   ////////////////
  //////////////////////////////////////////////

  onResize(event) {
    if (this.vrDisplayIsActive()) {
      this.setUpVr();
      return;
    }

    this.stopAnimationLoop(100)
      .then(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
        this.startAnimationLoop();
      });
  }

  setUpVr() {
    console.log('setUpVrMode');
    this.stopAnimationLoop(0).then(() => console.log('setUpVrMode.animationLoopStopped'));
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.vrCamera.aspect = width / height;
    this.vrCamera.updateProjectionMatrix();
    this.vrRenderer.setSize(width, height);
    this.vrHasBeenSetUp = true;
    this.startAnimationLoop();
  }

  onVrDisplayChange(event) {
    const isVr = this.vrDisplayIsActive();
    console.log('onVrDisplayChange', isVr);
    this.showVrElement(isVr);
    this.vrHasBeenSetUp = !isVr;
    this.onResize(event);
  }

}
