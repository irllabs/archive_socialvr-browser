import { AfterViewInit, Component, NgZone, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetInteractor } from 'core/asset/assetInteractor';

import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Room } from 'data/scene/entities/room';
import * as THREE from 'three';


import { AudioManager } from 'ui/editor/preview-space/modules/audioManager';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';
import { HotspotManager } from 'ui/editor/preview-space/modules/hotspotManager';
import { TextureLoader } from 'ui/editor/preview-space/modules/textureLoader';

import { DomSanitizer } from '@angular/platform-browser';
import { RoomManager } from 'data/scene/roomManager';
import { ICON_PATH } from 'ui/common/constants';
import { EventBus } from 'ui/common/event-bus';

import './aframe/preview-space';
import './aframe/preview-countdown'
import './aframe/play-once'

@Component({
  selector: 'preview-space',
  styleUrls: ['./preview-space.scss'],
  templateUrl: './preview-space.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewSpace {

  @ViewChild('worldElement') worldElement;
  @ViewChild('skyElement') skyElement;

  private camera: THREE.PerspectiveCamera;

  private roomHistory: string[] = [];
  private room: Room;
  private sky: string;
  private backgroundAudio: string;
  private narrationAudio: string;
  private soundtrackAudio: string;
  private soundtrackVolume: number;
  private isFirstInitialize: boolean = true;
  private autoplaySounds:boolean = true;
  
  constructor(
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private route: ActivatedRoute,
    private router: Router,
    private audioManager: AudioManager,
    private textureLoader: TextureLoader,
    private ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private roomManager: RoomManager,
    private eventBus: EventBus
  ) {
    this.ref.detach();
  }

  protected get iconBack(){
    return `${ICON_PATH}back_filled.png`;
  }

  protected get iconHome(){
    return `${ICON_PATH}home_filled.png`;
  }
  

  //////////////////////////////////////////////
  ///////////    HOUSE KEEPING    //////////////
  //////////////////////////////////////////////

  ngOnInit() {
    const projectIsEmpty = this.metaDataInteractor.projectIsEmpty();
    const isMultiView = this.router.url.includes('multiview=');
    const sceneEl = this.worldElement.nativeElement;
    if (projectIsEmpty && !isMultiView) {
      this.router.navigate(['/editor', { outlets: { 'view': 'flat' } }]);
      return;
    }
    const isShare = this.router.url.indexOf('share=1') !== -1;
    
    if (isShare && this.isFirstInitialize) {

      this.autoplaySounds = false;
      this.initWorld();
      this.eventBus.onPlayStoryModal(({ isDualScreen }) => {
        sceneEl.emit('show-countdown')
        
        
        
        if (isDualScreen) {
          sceneEl.emit('touch-all-audio')
          sceneEl.emit('run-countdown')

          sceneEl.enterVR()
        } else {
          sceneEl.emit('hide-countdown')
          sceneEl.emit('play-all-audio')
        }
        
        
        this.isFirstInitialize = false;
      });
      return;
    }
    this.initWorld();
  }

  initWorld(){
    Promise.all([
      this.audioManager.loadBuffers(),
      this.textureLoader.load(),
      fontHelper.load(),
    ])
      .then(() => {
        this.initSoundtrack();
        this.initRoom();
      })
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
  initSoundtrack(){
    this.soundtrackVolume = this.metaDataInteractor.getSoundtrack().getVolume()
    this.soundtrackAudio = this.metaDataInteractor.getSoundtrack().getBinaryFileData(true);
  }
  initRoom() {

    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);
    console.log(room)
    this.sky = room.getBackgroundImageBinaryData(true);
    this.room = room;
    this.backgroundAudio = room.getBackgroundAudioBinaryFileData(true);
    this.narrationAudio = room.getNarrationIntroBinaryFileData(true);
    this.roomHistory.push(roomId);
    setTimeout(() => {
      this.worldElement.nativeElement.emit('reset-camera');
    })
    this.ref.detectChanges();
  }


  //////////////////////////////////////////////
  /////// Room Changing Helpers ////////////////
  //////////////////////////////////////////////

  goToLastRoom() {
    this.roomHistory.pop();

    const lastRoom = this.roomHistory[this.roomHistory.length - 1];

    setTimeout(() => {
      this.sceneInteractor.setActiveRoomId(lastRoom);
      this.initRoom();
    });
  }

  goToHomeRoom() {
    const homeRoom = this.sceneInteractor.getHomeRoomId();

    this.sceneInteractor.setActiveRoomId(homeRoom);
    this.initRoom();
  }

  goToRoom(outgoingRoomId) {
    this.sceneInteractor.setActiveRoomId(outgoingRoomId);
    this.initRoom();
  }

}
