// Note: https://stackoverflow.com/questions/47246901/three-js-memory-leak-regardless-of-removing-mesh-from-scene

import {Component, NgZone, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import * as THREE from 'three';
import 'three/VRControls';
import 'three/VREffect';
import 'three/SvrControls';

import {EventBus, EventType} from 'ui/common/event-bus';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {CameraInteractor} from 'core/scene/cameraInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import {MultiViewService} from 'ui/editor/preview-space/modules/multiViewService';
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
import threeResourcePool from 'ui/editor/preview-space/modules/ThreeResourcePool';

const Stats = require('stats.js')
const stats = new Stats();
stats.showPanel(2); // 0: fps, 1: ms, 2: mb, 3+: custom
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
  private isInVrMode: boolean = false;
  private lastRenderTime: number = performance.now();
  private meshList: THREE.Mesh[] = [];
  private roomHistory: string[] = [];
  private shouldInit: boolean = false;
  private inRoomTween: boolean = false;
  private lookAtVector: THREE.Vector3;

  constructor(
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private cameraInteractor: CameraInteractor,
    private eventBus: EventBus,
    private ngZone: NgZone,
    private assetInteractor: AssetInteractor,
    private route: ActivatedRoute,
    private router: Router,
    private multiViewService: MultiViewService,
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
  }

  ngAfterViewInit() {
    if (!this.shouldInit) return;
    this.initScene();
    this.subscribeToEvents();
    Promise.all([
      this.audioManager.loadBuffers(),
      this.textureLoader.load(),
      this.initVrDisplay(),
      fontHelper.load(),
    ])
    .then(() => {
      threeResourcePool.init();
      return this.initRoom();
    })
    .catch(error => console.log('EditSphereBaseInit', error));
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    if (this.camera) {
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(this.camera.quaternion);
      this.cameraInteractor.setCameraDirection(cameraDirection.x, cameraDirection.y, cameraDirection.z);
    }
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

    this.reticle.init(this.camera, this.vrCamera);
    //this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: window.orientation == 'undefined'});
    this.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
    this.svrControls = new THREE.SvrControls(this.camera, canvas, this.cameraInteractor.getCameraDirection());
    this.vrControls = new THREE.VRControls(this.vrCamera);
    this.vrEffect = new THREE.VREffect(this.renderer);
    this.vrEffect.setSize(window.innerWidth, window.innerHeight);

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
    if (!this.vrDisplay.isPresenting)  {
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
    // MeshUtil.cleanMeshMemory(this.sphereMesh);
    // this.sphereMesh.material = new THREE.MeshBasicMaterial({map: sphereTexture, side: THREE.BackSide});
    this.sphereMesh.material = threeResourcePool.getSphereMaterialFromTexture(sphereTexture);
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
    const isInVrMode = this.vrDisplay.isPresenting;
    const reticle = this.reticle.getActiveReticle(isInVrMode);
    const camera = isInVrMode ? this.vrCamera : this.camera;
    isInVrMode ? this.vrControls.update() : this.svrControls.update();
    if (!this.inRoomTween) {this.hotspotManager.update(reticle, elapsedTime);}
    this.menuManager.update(reticle, camera);
    this.multiViewService.update(camera);
    TWEEN.update();
  }

  private render() {
    //this.scene.updateMatrixWorld(true);
    // render vr mode
    if (this.vrDisplay.isPresenting) {
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
       this.eventBus.onSelectRoom(lastRoom, false);
    });
  }

  goToHomeRoom() {
    var homeRoom = this.sceneInteractor.getHomeRoomId();
    this.sceneInteractor.setActiveRoomId(homeRoom);
    this.eventBus.onSelectRoom(homeRoom, false);
  }

  goToRoom(outgoingRoomId) {

    this.inRoomTween = true;
    this.lookAtVector = new THREE.Vector3(0,0,0);
    //get the direciton we should move in
    if (this.vrDisplay.isPresenting) {
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
      //console.log("onCopmlete for tween");
      this.isInRenderLoop = false;
      this.inRoomTween = false;
      this.sceneInteractor.setActiveRoomId(outgoingRoomId);
      this.eventBus.onSelectRoom(outgoingRoomId, false);
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

  // TODO: mouse or touch hotspot activation
  private onMouseDown(event) {}

  onResize(event) {
    cancelAnimationFrame(this.animationRequest);
    this.isInRenderLoop = false;

    setTimeout(() => {
      onResize(this.camera, this.renderer)
        .then(() => {
          // AHHH!!!!
          cancelAnimationFrame(this.animationRequest);
          this.isInRenderLoop = false;

          this.vrEffect.setSize(window.innerWidth, window.innerHeight);
          this.reticle.showVrReticle(this.vrDisplay.isPresenting);
          this.isInRenderLoop = true;
          this.animate();
        })
        .catch(error => console.log('preview-space resize error', error));
    });
  }

  protected subscribeToEvents() {
    if (this.subscriptions.size > 0) {
      return;
    }
    const onRoomSelect: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(observedData => this.initRoom(), error => console.log('error', error));

    const windowResize: Subscription = this.eventBus.getObservable(EventType.WINDOW_RESIZE)
      .subscribe(
        windowDims => this.onResize(windowDims),
        error => console.log('EditSpaceFlat.onResize', error)
      );

    const onVrDisplayChange: Subscription = this.eventBus.getObservable(EventType.VR_DISPLAY_CHANGE)
        .subscribe(
          event => this.onResize(null),
          error => console.log('error', error)
        );

    // TODO: move this to ngOnInit ... even though it is a subscription
    const onMultiView: Subscription = this.route.queryParams
          .filter(params => !!params['multiview'])
          .map(params => params['multiview'])
          //.first()
          .subscribe(
            multiViewValue => {
              this.multiViewService.openSharedValue(multiViewValue)
                .then(() => {
                  this.ngAfterViewInit();
                  const onRoomChange = this.multiViewService.observeRoom()
                    .subscribe(
                      roomData => {
                        roomData.forEach((user, index) => {
                          this.multiViewService.updateUser(user, index);
                        });
                        if (!this.isInRenderLoop) {
                          this.animate();
                        }
                      },
                      error => console.log('error', error)
                    );
                  this.subscriptions.add(onRoomChange);
                })
                .catch(error => console.log('error', error));
            },
            error => console.log('error', error)
          );

    this.subscriptions.add(onRoomSelect);
    this.subscriptions.add(windowResize);
    this.subscriptions.add(onVrDisplayChange);
    this.subscriptions.add(onMultiView);
  }



}
