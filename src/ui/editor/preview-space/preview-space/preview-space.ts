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

import './aframe/preview-space';

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
    private roomManager: RoomManager
  ) {
    this.ref.detach();
  }

  protected get iconBack(){
    return `${ICON_PATH}back_filled.png`;
  }

  protected get iconHome(){
    return `${ICON_PATH}home_filled.png`;
  }

  protected get rooms() {
    return this.roomManager.getRooms()
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
