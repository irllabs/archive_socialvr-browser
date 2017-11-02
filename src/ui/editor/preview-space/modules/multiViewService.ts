import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {ProjectInteractor} from 'core/project/projectInteractor';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {UserInteractor} from 'core/user/userInteractor';
import {ChatInteractor} from 'core/chat/chatInteractor';
import {EventBus} from 'ui/common/event-bus';
import {decodeMultviewParam} from 'ui/editor/util/publicLinkHelper';
import {THREE_CONST} from 'ui/common/constants';

const defaultSpotlight = new THREE.SpotLight(
  0xFFFFFF,  // COLOR
  1, // INTENSITY
  THREE_CONST.SPHERE_RADIUS + 1, // DISTANCE
  (Math.PI * 2) / 18, // ANGLE
  0.5, // PENUMBRA
  0 // DECAY
);

class LightHelper {

  private spotLight: THREE.SpotLight;
  private target: THREE.Object3D = new THREE.Object3D();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spotLight = defaultSpotlight.clone();
    this.spotLight.position.set(0, 0, 0);
    this.target.position.set(0, 0, -1);
    this.spotLight.target = this.target;
    this.scene.add(this.spotLight);
    this.scene.add(this.target);
  }

  setPosition(x, y, z) {
    this.target.position.set(x, y, z);
  }

  removeFromScene() {
    this.scene.remove(this.spotLight);
    this.scene.remove(this.target);
  }

}

@Injectable()
export class MultiViewService {

  private chatRoomId: string = '';
  private lastLookAtTime: number = performance.now();
  private userViewPositions: Map<string, LightHelper> = new Map();
  private lastCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private userId: string;
  private scene: THREE.Scene;
  private millisecondThrottle = 200;

  constructor(
    private eventBus: EventBus,
    private projectInteractor: ProjectInteractor,
    private chatInteractor: ChatInteractor,
    private sceneInteractor: SceneInteractor,
    private userInteractor: UserInteractor
  ) {}

  init(scene: THREE.Scene, reticles, multiViewValue: string) {
    this.scene = scene;
    this.userId = this.userInteractor.getUserId();
    this.chatRoomId = multiViewValue;
    this.observeRoom();
    this.initUserLight(scene, reticles); // TODO
  }

  initUserLight(scene: THREE.Scene, reticles) {
    const touchSpotLight = defaultSpotlight.clone();
    const vrSpotLight = defaultSpotlight.clone();
    const touchSpotLightTarget = new THREE.Object3D();
    const vrSpotLightTarget = new THREE.Object3D();
    touchSpotLightTarget.position.set(0, 0, -1);
    vrSpotLightTarget.position.set(0, 0, -1);
    touchSpotLight.position.set(0, 0, THREE_CONST.CAMERA_RETICLE);
    vrSpotLight.position.set(0, 0, THREE_CONST.CAMERA_RETICLE);
    touchSpotLight.target = touchSpotLightTarget;
    vrSpotLight.target = vrSpotLightTarget;
    reticles.touch.add(touchSpotLight);
    reticles.touch.add(touchSpotLightTarget);
    reticles.vr.add(vrSpotLight);
    reticles.vr.add(vrSpotLightTarget);
  }

  hasBeenInitialized(): boolean {
    return !!this.chatRoomId;
  }

  update(camera: THREE.PerspectiveCamera) {
    const cameraDirection = camera.getWorldDirection();
    if (cameraDirection.equals(this.lastCameraPosition) || !this.chatRoomId) {
      return;
    }
    this.lastCameraPosition = cameraDirection;
    const zVector = new THREE.Vector3(0, 0, -400);
    const cameraVector = camera.localToWorld(zVector);
    this.setLookAt(cameraVector.x, cameraVector.y, cameraVector.z);
  }

  private updateUser(user) {
    const userId = user.userId;
    if (userId === this.userId) {
      return;
    }
    const userHasData = user.lookingAt && user.lookingAt.x && user.lookingAt.y && user.lookingAt.z;
    if (!userHasData) {
      return;
    }
    if (!this.userViewPositions.has(userId)) {
      this.userViewPositions.set(userId, new LightHelper(this.scene));
      this.userViewPositions.get(userId).setPosition(
        user.lookingAt.x, user.lookingAt.y, user.lookingAt.z
      );
    }
    else {
      this.userViewPositions.get(userId).setPosition(
        user.lookingAt.x, user.lookingAt.y, user.lookingAt.z
      );
    }
  }

  openSharedValue(sharedValue: string): Promise<any> {
    const decodedValue = decodeMultviewParam(sharedValue);
    if (!decodedValue.ok) {
      return Promise.reject(decodedValue.data);
    }
    const userId= decodedValue.data.userId;
    const projectId = decodedValue.data.projectId;

    const subscription = this.chatInteractor.joinRoom(sharedValue)
      .subscribe(
        success => console.log(`joined Room: ${this.chatRoomId}`),
        error => console.log('error', error)
      );
    this.subscriptions.add(subscription);
    return this.openProject(userId, projectId);
  }

  private setLookAt(x: number, y: number, z: number) {
    if (performance.now() - this.lastLookAtTime > this.millisecondThrottle) {
      this.chatInteractor.setLookAt(this.chatRoomId, x, y, z);
      this.lastLookAtTime = performance.now();
    }
  }

  onDestory() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.chatInteractor.leaveRoom(this.chatRoomId);
  }

  private observeRoom() {
    const address = `/chatrooms/${this.chatRoomId}/`;
    const onRoomChange = this.chatInteractor.observeRoom(address)
      .subscribe(
        roomData => this.onRoomChange(roomData),
        error => console.log('error', error)
      );
    this.subscriptions.add(onRoomChange);
  }

  private onRoomChange(roomData) {
    roomData = roomData || {};
    const remoteUsers = new Set(Object.keys(roomData));
    const localUsers = Array.from(this.userViewPositions.keys());
    const usersToRemove = new Set(
      localUsers.filter(localUserId => !remoteUsers.has(localUserId))
    );
    if (usersToRemove.size > 0) {
      usersToRemove.forEach(userId => {
        const lightHelper = this.userViewPositions.get(userId);
        lightHelper.removeFromScene();
        this.userViewPositions.delete(userId);
      });
    }

    Object.keys(roomData).forEach(key => this.updateUser(roomData[key]));
  }

  // TODO: refactor into different service
  private openProject(userId: string, projectId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eventBus.onStartLoading();
      const openProject = this.projectInteractor.openProject(userId, projectId)
        .subscribe(
          response => {
            this.sceneInteractor.setActiveRoomId(null);
            this.eventBus.onSelectRoom(null, false);
            resolve();
          },
          error => reject(error),
          () => this.eventBus.onStopLoading()
        );
      this.subscriptions.add(openProject);
    });
  }

}
