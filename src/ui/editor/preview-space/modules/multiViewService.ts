import { Injectable } from '@angular/core';
import { ChatInteractor } from 'core/chat/chatInteractor';

import { ProjectInteractor } from 'core/project/projectInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Observable } from 'rxjs/Observable';
import * as THREE from 'three';
import { EventBus } from 'ui/common/event-bus';

@Injectable()
export class MultiViewService {

  private chatRoomId: string = '';
  private lastLookAtTime: number = performance.now();
  private testMultiViewPosition: Map<Number, THREE.Mesh> = new Map();
  private lastCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(
    private eventBus: EventBus,
    private projectInteractor: ProjectInteractor,
    private chatInteractor: ChatInteractor,
    private sceneInteractor: SceneInteractor,
  ) {
  }

  initBeachBalls(scene: THREE.Scene, colorBallTexture: THREE.Texture) {
    const cbGeometry = new THREE.SphereGeometry(5, 32, 32);
    // const cbTexture = this.assetInteractor.getTextureById('colorBall');
    colorBallTexture.wrapS = THREE.RepeatWrapping;
    colorBallTexture.wrapT = THREE.RepeatWrapping;
    colorBallTexture.offset.set(0, 0);
    colorBallTexture.repeat.set(2, 1);
    const cbMaterial = new THREE.MeshBasicMaterial({ map: colorBallTexture, side: THREE.FrontSide });
    const cbMesh = new THREE.Mesh(cbGeometry, cbMaterial);
    // this.colorBallMesh = cbMesh;

    new Array(2).fill(null).map((nullVal, index) => index + 1).forEach(index => {
      const colorBall: THREE.Mesh = cbMesh.clone();
      colorBall.position.set(10, 10, 10);
      // colorBall.lookAt(camera.position);
      colorBall.visible = true;
      this.testMultiViewPosition.set(index, colorBall);
      scene.add(colorBall);
    });
  }

  update(camera: THREE.PerspectiveCamera) {
    // if change in look at, send value
    const cameraDirection = camera.getWorldDirection();
    if (cameraDirection.equals(this.lastCameraPosition)) {
      return;
    }
    this.lastCameraPosition = cameraDirection;

    const zVector = new THREE.Vector3(0, 0, -100);
    const cameraVector = camera.localToWorld(zVector);
    this.setLookAt(cameraVector.x, cameraVector.y, cameraVector.z);
  }

  updateUser(user, index) {
    const userHasData = user.lookingAt.x && user.lookingAt.y && user.lookingAt.z;
    if (this.testMultiViewPosition.has(index) && userHasData) {
      this.testMultiViewPosition.get(index).position.set(
        user.lookingAt.x, user.lookingAt.y, user.lookingAt.z,
      );
    }
  }

  openSharedValue(sharedValue: string): Promise<any> {
    const [userId, projectId] = sharedValue.split('-');
    if (userId === undefined || projectId === undefined) {
      console.log('error', 'userId', userId, 'projectId', projectId);
      return;
    }
    console.log('open project for', userId, projectId);
    console.log('join chat room:', sharedValue);

    this.chatRoomId = sharedValue;

    // if current project === multiview project, join chatroom

    // if current project !== multiview project, open project and join chatroom

    this.joinMultiView();
    // .switchMap(chatRoomId => this.joinMultiView(chatRoomId));
    // const chatAddress = `/chatrooms/${this.chatRoomId}/`;
    return this.openProject(projectId);
    // .then(() => this.chatInteractor.observeRoom(chatAddress));
  }

  setLookAt(x: number, y: number, z: number) {
    if (performance.now() - this.lastLookAtTime > 100) {
      this.chatInteractor.setLookAt(this.chatRoomId, x, y, z);
      this.lastLookAtTime = performance.now();
    }
  }

  observeRoom(): Observable<any> {
    const address = `/chatrooms/${this.chatRoomId}/`;
    return this.chatInteractor.observeRoom(address);
  }

  // TODO: refactor into different service
  private openProject(projectId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eventBus.onStartLoading();
      this.projectInteractor.openProject(projectId)
        .subscribe(
          () => {
            //reset the current scene
            this.sceneInteractor.setActiveRoomId(null);
            this.eventBus.onSelectRoom(null, false);
            // this.metaDataInteractor.setIsReadOnly(false);
            resolve();
          },
          error => reject(error),
          () => this.eventBus.onStopLoading(),
        );
    });
  }

  private joinMultiView() {
    this.chatInteractor.joinRoom(this.chatRoomId)
      .subscribe(
        success => console.log('joined Room', success),
        error => console.log('error', error),
      );
  }

}
