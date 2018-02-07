import {Component, NgZone, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import * as THREE from 'three';
import 'three/VRControls';
import 'three/VREffect';
import 'three/SvrControls';

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
import {buildScene, onResize} from 'ui/editor/util/threeUtil';
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

  @ViewChild('editSpaceSphere') editSpaceSphere;
  @ViewChild('globeCanvas') globeCanvas;

  private renderer: THREE.WebGLRenderer;
  private vrControls: THREE.VRControls
  private vrEffect: THREE.VREffect;
  private svrControls: THREE.SvrControls;
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
    .then(() => this.initRoom())
    .catch(error => console.log('EditSphereBaseInit', error));
  }

  ngOnDestroy() {
    // this.svrControls.dispose();
    window.removeEventListener('resize', this.onResizeFn, false);
    window.removeEventListener('vrdisplaypresentchange', this.onVrDisplayChangeFn, false);
    this.cameraInteractor.setCameraAngles(this.svrControls.getCameraAngles());
    cancelAnimationFrame(this.animationRequest);
    this.isInRenderLoop = false;
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
    const canvas = this.globeCanvas.nativeElement;
    const scenePrimitives = buildScene();
    this.sphereMesh = scenePrimitives.sphereMesh;
    this.camera = scenePrimitives.camera;
    this.vrCamera = scenePrimitives.vrCamera;
    this.scene = scenePrimitives.scene;
    this.sphereMesh.material = this.sphereMaterial;

    this.reticle.init(this.camera, this.vrCamera);
    //this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: window.orientation == 'undefined'});
    this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: false});
    this.svrControls = new THREE.SvrControls({
      camera: this.camera,
      domElement: canvas,
      initialCameraAngles: this.cameraInteractor.getCameraAngles(),
      executionContext: this.ngZone.runOutsideAngular.bind(this.ngZone)
    });

    this.ngZone.runOutsideAngular(() => {
      this.vrControls = new THREE.VRControls(this.vrCamera);
      this.vrEffect = new THREE.VREffect(this.renderer);
      this.vrEffect.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initRoom() {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);
    //console.log('campos init: ', this.camera.position);
    //reset room tweens
    this.sphereMesh.position.set(0,0,0);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 0.0001;
    this.camera.updateProjectionMatrix();
    room.getBackgroundIsVideo() ? this.init3dRoom(room) : this.init2dRoom(roomId);
    this.audioManager.stopAllAudio();
    this.audioManager.playBackgroundAudio();
    this.audioManager.playNarration();
    this.audioManager.playSoundtrack();
    this.isInRenderLoop = true;



    /*
    if (!this.vrDisplay && this.vrDisplay.isPresenting)  {
    // tween with fov
    this.camera.fov = THREE_CONST.FOV_OUT;

    var tweenRoomIn = new TWEEN.Tween(this.camera)
    .to({
        fov: THREE_CONST.FOV_NORM
    },THREE_CONST.TWEEN_ROOM_MOVETIMEIN)
    .easing(TWEEN.Easing.Linear.None).onUpdate( () => { })
    .onComplete( () => {
      //console.log("Init room: ",roomId);
      this.roomHistory.push(roomId);
    }).start();
    } else {
      this.roomHistory.push(roomId);
    }
    */

    //tween with sphere position towards is
    // this.sphereMesh.position.set(THREE_CONST.TWEEN_ROOM_MOVEIN,0,0);
    // var tweenRoomOut = new TWEEN.Tween(this.sphereMesh.position).to({
    //     x: 0,
    //     y: 0,
    //     z: 0
    // },THREE_CONST.TWEEN_ROOM_MOVETIMEIN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    //
    // }).onComplete( () => {
    //   //console.log("onCopmlete for tween");
    //   this.roomHistory.push(roomId);
    // }).start();

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
    this.onResize(null);
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

  private animate() {
    if (!this.isInRenderLoop) {
      return;
    }
    stats.begin();
    //console.log("animate",this.isInRenderLoop);
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

  private logCamLookat(tag: number) {
    var vector = new THREE.Vector3(0,0,0);
    this.camera.getWorldDirection( vector );
    console.log("lookAt: ",tag,vector);
  }

  private update(elapsedTime: number) {
    const isInVrMode = this.vrDisplay && this.vrDisplay.isPresenting;
    const reticle = this.reticle.getActiveReticle(isInVrMode);
    const camera = isInVrMode ? this.vrCamera : this.camera;
    isInVrMode ? this.vrControls.update() : this.svrControls.update();
    if (!this.inRoomTween) {this.hotspotManager.update(reticle, elapsedTime);}
    this.menuManager.update(reticle, camera);
    // this.multiViewService.update(camera);
    TWEEN.update();
  }

  private render() {
    //this.scene.updateMatrixWorld(true);
    // render vr mode
    if (this.vrDisplay && this.vrDisplay.isPresenting) {
      this.vrEffect.render(this.scene, this.vrCamera);
      this.animationRequest = this.vrDisplay.requestAnimationFrame(this.animate.bind(this));
    }
    // render non-vr mode
    else {
      this.renderer.render(this.scene, this.camera);
      stats.end();
      this.animationRequest = requestAnimationFrame(this.animate.bind(this));
    }
  }

  private debounce(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		}
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	}
  }
  //////////////////////////////////////////////
  /////// Room Changing Helpers ////////////////
  //////////////////////////////////////////////

  goToLastRoom() {
    this.roomHistory.pop();
    var lastRoom =   this.roomHistory[this.roomHistory.length-1];
    this.isInRenderLoop = false;
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
    if (this.vrDisplay && this.vrDisplay.isPresenting) {
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
      this.isInRenderLoop = false;
      this.inRoomTween = false;
      this.sceneInteractor.setActiveRoomId(outgoingRoomId);
      this.initRoom();
    }).start();
  }

  //////////////////////////////////////////////
  //////////////   VR MODE      ////////////////
  //////////////////////////////////////////////

  private requestVrMode($event) {
    this.isInRenderLoop = false;
    this.vrDisplay.requestPresent([{source: this.renderer.domElement}])
      .catch(error => console.log('requestVRMode error', error));
  }


  private initVrDisplay(): Promise<any> {
    return navigator.getVRDisplays()
      .then(vrDisplayList => {
        if (vrDisplayList.length > 0) {
          this.vrDisplay = vrDisplayList[0];
          this.showVrModeButton = this.vrDisplay.capabilities.canPresent;
        }
      })
      .catch(error => console.log('initVrDisplay', error));
  }

  //////////////////////////////////////////////
  //////////////   EVENTS ETC   ////////////////
  //////////////////////////////////////////////

  // potential ios issue?
  // https://github.com/immersive-web/webvr-polyfill/blob/master/examples/index.html
  onResize(event) {
    cancelAnimationFrame(this.animationRequest);
    this.isInRenderLoop = false;

    setTimeout(() => {
      onResize(this.camera, this.renderer)
        .then(() => {
          cancelAnimationFrame(this.animationRequest);
          const isInVrMode = !!this.vrDisplay && !!this.vrDisplay.isPresenting
          this.isInRenderLoop = false;
          this.vrEffect.setSize(window.innerWidth, window.innerHeight);

          // better image quality but worse performance
          this.renderer.setPixelRatio(window.devicePixelRatio || 1);
          this.renderer.setSize(window.innerWidth, window.innerHeight, false);

          this.reticle.showVrReticle(isInVrMode);
          this.isInRenderLoop = true;
          this.animate();
        })
        .catch(error => console.log('preview-space resize error', error));
    });
  }

  onVrDisplayChange(event) {
    this.onResize(event);
  }

}
