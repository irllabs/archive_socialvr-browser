import { AfterViewInit, Component, NgZone, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetInteractor } from 'core/asset/assetInteractor';
import { CameraInteractor } from 'core/scene/cameraInteractor';

import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Room } from 'data/scene/entities/room';
import { Subscription } from 'rxjs/Subscription';
import 'three';
import 'three/VRControls';
import 'three/VREffect';
import { THREE_CONST } from 'ui/common/constants';
import { Video3D } from 'ui/editor/edit-space/video3D';
import { AudioManager } from 'ui/editor/preview-space/modules/audioManager';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';
import { HotspotManager } from 'ui/editor/preview-space/modules/hotspotManager';
import { MenuManager } from 'ui/editor/preview-space/modules/menuManager';
import * as MeshUtil from 'ui/editor/preview-space/modules/meshUtil';
import { Reticle } from 'ui/editor/preview-space/modules/reticle';
import { TextureLoader } from 'ui/editor/preview-space/modules/textureLoader';
import SvrControls from 'ui/editor/util/SvrControls';
import { buildScene, onResize } from 'ui/editor/util/threeUtil';

import './aframe/preview-space';

const TWEEN = require('@tweenjs/tween.js');
const roomSphereFragShader = require('ui/editor/util/shaders/roomSphere.frag');
const roomSphereVertShader = require('ui/editor/util/shaders/roomSphere.vert');

@Component({
  selector: 'preview-space',
  styleUrls: ['./preview-space.scss'],
  templateUrl: './preview-space.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewSpace implements AfterViewInit {

  @ViewChild('worldElement') worldElement;
  @ViewChild('globeScene') globeScene;

  private renderer: THREE.WebGLRenderer;
  private vrControls: THREE.VRControls;
  private vrEffect: THREE.VREffect;
  private svrControls: any;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vrCamera: THREE.PerspectiveCamera;
  private sphereMesh: THREE.Mesh;
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private vrDisplay: VRDisplay;
  private isInRenderLoop: boolean = false;
  private activateHotspotTimeout: number;
  private showVrModeButton: boolean = false;
  private showUnmuteButton: boolean = false;
  private video3D: Video3D;
  private animationRequest: number;
  private lastRenderTime: number = performance.now();
  private meshList: THREE.Mesh[] = [];
  private roomHistory: string[] = [];
  private shouldInit: boolean = false;
  private isFirstInitialize: boolean = true;
  private inRoomTween: boolean = false;
  private lookAtVector: THREE.Vector3;
  private sphereMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: null, side: THREE.BackSide });
  //private onResizeFn: Function = this.onResize.bind(this);

  private room: Room;
  private sky: string;
  private backgroundAudio: string;
  private narrationAudio: string;



  // private onVrDisplayChangeFn: Function = this.onVrDisplayChange.bind(this);

  constructor(
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private route: ActivatedRoute,
    private router: Router,
    private audioManager: AudioManager,
    private textureLoader: TextureLoader,
    private ref: ChangeDetectorRef
  ) {
    this.ref.detach();
  }

  //////////////////////////////////////////////
  ///////////    HOUSE KEEPING    //////////////
  //////////////////////////////////////////////

  ngOnInit() {
    const projectIsEmpty = this.metaDataInteractor.projectIsEmpty();
    const isMultiView = this.router.url.includes('multiview=');

    if (projectIsEmpty && !isMultiView) {
      this.router.navigate(['/editor', { outlets: { 'view': 'flat' } }]);
      return;
    }

    Promise.all([
      this.audioManager.loadBuffers(),
      this.textureLoader.load(),
      fontHelper.load(),
    ])
      .then(() => this.initRoom())
      .catch(error => console.log('EditSphereBaseInit', error));
  }

  ngAfterViewInit() {
    this.worldElement.nativeElement.addEventListener('switch-room', (e) => {
      if (e.detail === 'last') {
        this.goToLastRoom();
      } else if (e.detail === 'home') {
        this.goToHomeRoom();
      } else {
        this.goToRoom(e.detail);
      }
    });

  }
  
  ngOnDestroy() {
    this.worldElement.nativeElement.renderer.dispose();
  }

  //////////////////////////////////////////////
  ///////////  INITIALIZATION     //////////////
  //////////////////////////////////////////////

  initRoom(isTransition = false) {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);

    this.room = room;
    this.sky = room.getBackgroundImageBinaryData(true);
    
    this.backgroundAudio = room.getBackgroundAudioBinaryFileData(true);
    this.narrationAudio = room.getNarrationIntroBinaryFileData(true)
    this.roomHistory.push(roomId);
    this.ref.detectChanges();
  }


  //////////////////////////////////////////////
  /////// Room Changing Helpers ////////////////
  //////////////////////////////////////////////

  goToLastRoom() {
    const lastRoom = this.roomHistory[this.roomHistory.length - 1];

    this.roomHistory.pop();
    this.isInRenderLoop = false;

    setTimeout(() => {
      this.sceneInteractor.setActiveRoomId(lastRoom);
      this.initRoom(true);
    });
  }

  goToHomeRoom() {
    const homeRoom = this.sceneInteractor.getHomeRoomId();

    this.sceneInteractor.setActiveRoomId(homeRoom);
    this.initRoom(true);
  }

  goToRoom(outgoingRoomId) {
    this.sceneInteractor.setActiveRoomId(outgoingRoomId);
    this.initRoom(true);
  }

}
