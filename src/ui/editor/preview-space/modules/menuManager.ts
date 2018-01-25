import {Injectable} from '@angular/core';
import * as THREE from 'three';

import {AssetInteractor} from 'core/asset/assetInteractor';
import {getCoordinatePosition} from 'ui/editor/util/iconPositionUtil';
import {sphericalToCoordinate, coordinateToSpherical, car2pol, pol2car} from 'ui/editor/util/iconPositionUtil';
import {THREE_CONST} from 'ui/common/constants';

const TWEEN = require('@tweenjs/tween.js');

@Injectable()
export class MenuManager {
  private menu: THREE.Group;
  private backButtonMesh: THREE.Mesh;
  private backButtonSprite: THREE.Sprite;
  private homeButtonMesh: THREE.Mesh;
  private backButtonSpriteG: THREE.Sprite;  //for catching the raycaster when the icon gets smaller!
  private backButtonMeshG: THREE.Mesh;  //for catching the raycaster when the icon gets smaller!
  private homeButtonMeshG: THREE.Mesh;
  private panelMesh: THREE.Mesh;
  private panelSprite: THREE.Sprite;
  private goToBackRoom: Function;
  private goToHomeRoom: Function;
  private hButState: number; //0 means far, 1 means active
  private bButState: number; //0 means far, 1 means active
  private hButStateLast: number; //0 means far, 1 means active
  private bButStateLast: number; //0 means far, 1 means active
  private tweenHomeActivate: any;
  private tweenBackActivate: any;
  private reticleRaycast: THREE.Raycaster = new THREE.Raycaster();
  private reitlceRay: THREE.Vector2 = new THREE.Vector2();

  constructor(
    private assetInteractor: AssetInteractor
  ) {}

  exists():boolean {
    //!! cast the existence of this.menu as a boolean
    return !!this.menu;
  }

  load(scene: THREE.Scene, cameraPosition: THREE.Vector3, goToBackRoom: Function, goToHomeRoom: Function) {
    //if (this.menu) {return}; //don't remake the menu if it's already there

    //functions for homeroom and last room
    this.goToBackRoom = goToBackRoom;
    this.goToHomeRoom = goToHomeRoom;

    //state variables to debounce home and back buttons
    this.hButState = 0;
    this.bButState = 0;


    //creat group
    this.menu = new THREE.Group();
    var menuPos = pol2car(THREE_CONST.CAMERA_NAVPANEL,
                          THREE_CONST.NAVPANEL_THETA,
                          THREE_CONST.NAVPANEL_PHI);
    this.menu.position.set(menuPos.x, menuPos.y, menuPos.z);
    this.menu.name = 'menu';

    //transparent panel
    const panelGeometry = new THREE.PlaneGeometry(THREE_CONST.NAVPANEL_W, THREE_CONST.NAVPANEL_H);
    const panelMaterial = new THREE.MeshBasicMaterial({opacity: THREE_CONST.NAVPANEL_OPACITY, transparent: true, side:THREE.FrontSide});
    const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.position.set(menuPos.x,menuPos.y,menuPos.z);
    this.panelMesh = panelMesh;

    // /// try a sprite
    // //var panelSpriteMap = new THREE.TextureLoader().load( "sprite.png" );
    // const panelSpriteMaterial = new THREE.SpriteMaterial( { opacity: THREE_CONST.NAVPANEL_OPACITY, transparent: true, side:THREE.FrontSide } );
    // const panelSprite = new THREE.Sprite( panelSpriteMaterial );
    // this.panelSprite = panelSprite;

    //back button
    const backBtnGeometry = new THREE.PlaneGeometry(THREE_CONST.HOME_BACK_DIM, THREE_CONST.HOME_BACK_DIM); //need THREE global
    const backBtnTexture = this.assetInteractor.getTextureById('back');
    const backBtnMaterial = new THREE.MeshBasicMaterial({map: backBtnTexture, transparent: true, side:THREE.DoubleSide});
    const backBtnMesh = new THREE.Mesh(backBtnGeometry, backBtnMaterial);
    backBtnMesh.position.set(menuPos.x-40,menuPos.y-30,menuPos.z-100);
    backBtnMesh.name = 'backButtonIcon';
    backBtnMesh.frustumCulled = false;
    //backBtnMesh.lookAt(cameraPosition);
    this.backButtonMesh = backBtnMesh;

    //back button ghost, used for raycaster
    const backBtnGeometryG = new THREE.PlaneGeometry(THREE_CONST.HOME_BACK_DIM, THREE_CONST.HOME_BACK_DIM); //need THREE global
    const backBtnTextureG = this.assetInteractor.getTextureById('back');
    const backBtnMaterialG = new THREE.MeshBasicMaterial({map: backBtnTexture, transparent: true, side:THREE.FrontSide});
    const backBtnMeshG = new THREE.Mesh(backBtnGeometryG, backBtnMaterialG);
    backBtnMeshG.position.set(menuPos.x-40,menuPos.y-30,menuPos.z-98);
    backBtnMeshG.name = 'backButton';
    backBtnMeshG.material.opacity = 0;
    //backBtnMesh.lookAt(cameraPosition);
    this.backButtonMeshG = backBtnMeshG;


    // //back button
    // const backBtnSpriteMap = new THREE.TextureLoader().load('assets/icons/back_filled.png');
    // const backBtnSpriteMaterial = new THREE.SpriteMaterial( { opacity: THREE_CONST.NAVPANEL_OPACITY, transparent: true, side:THREE.FrontSide } );
    // const backBtnSprite = new THREE.Sprite( panelSpriteMaterial );
    // backBtnSprite.position.set(menuPos.x-40,menuPos.y,menuPos.z-10);
    // backBtnSprite.name = 'backButtonIcon';
    // this.backButtonSprite = backBtnSprite;
    //
    //
    // //back button ghost, used for raycaster
    // //const backBtnSpriteGMap = new THREE.TextureLoader().load('assets/icons/back_filled.png');
    // const backBtnSpriteMaterialG = new THREE.SpriteMaterial( { opacity: 0, transparent: true, side:THREE.FrontSide } );
    // const backBtnSpriteG = new THREE.Sprite( backBtnSpriteMaterialG );
    // backBtnSpriteG.position.set(menuPos.x-40,menuPos.y,menuPos.z-8);
    // backBtnSpriteG.name = 'backButton';
    // this.backButtonSpriteG = backBtnSpriteG;



    //home button
    const homeBtnGeometry = new THREE.PlaneGeometry(THREE_CONST.HOME_BACK_DIM, THREE_CONST.HOME_BACK_DIM);
    const homeBtnTexture = this.assetInteractor.getTextureById('home');
    const homeBtnMaterial = new THREE.MeshBasicMaterial({map: homeBtnTexture, transparent: true, side:THREE.FrontSide});
    const homeBtnMesh = new THREE.Mesh(homeBtnGeometry, homeBtnMaterial);
    homeBtnMesh.position.set(menuPos.x+40,menuPos.y-30,menuPos.z-100);
    homeBtnMesh.name = 'homeButtonIcon';
    //homeBtnMesh.lookAt(cameraPosition);
    this.homeButtonMesh = homeBtnMesh;

    const homeBtnGeometryG = new THREE.PlaneGeometry(THREE_CONST.HOME_BACK_DIM, THREE_CONST.HOME_BACK_DIM);
    const homeBtnTextureG = this.assetInteractor.getTextureById('home');
    const homeBtnMaterialG = new THREE.MeshBasicMaterial({map: homeBtnTexture, transparent: true, side:THREE.FrontSide});
    const homeBtnMeshG = new THREE.Mesh(homeBtnGeometryG, homeBtnMaterialG);
    homeBtnMeshG.position.set(menuPos.x+40,menuPos.y-30,menuPos.z-98);
    homeBtnMeshG.name = 'homeButton';
    homeBtnMeshG.material.opacity = 0;
    //homeBtnMesh.lookAt(cameraPosition);
    this.homeButtonMeshG = homeBtnMeshG;


    //add menu to scene
    //this.menu.add(backBtnMesh);
    //this.menu.add(backBtnSprite);
    this.menu.add(homeBtnMesh);
    this.menu.add(homeBtnMeshG);
    this.menu.add(backBtnMesh);
    this.menu.add(backBtnMeshG);
    //this.menu.add(backBtnSpriteG);
    this.menu.add(panelMesh);
    //this.menu.add(panelSprite);
    this.menu.lookAt(cameraPosition);
    scene.add(this.menu);

    //this is required for the raycaster to work properly!!!
    this.menu.updateMatrixWorld(true);
    this.backButtonMesh.getWorldPosition();
    this.backButtonMeshG.getWorldPosition();
    //this.backButtonSprite.getWorldPosition();
    this.homeButtonMesh.getWorldPosition();
    this.homeButtonMeshG.getWorldPosition();
    //this.backButtonSpriteG.getWorldPosition();
    this.panelMesh.getWorldPosition();
    //this.panelSprite.getWorldPosition();

  }

  update(reticle, camera: THREE.PerspectiveCamera) {
    this.reticleRaycast.setFromCamera( this.reitlceRay, camera );
    const intersects = this.reticleRaycast.intersectObjects(this.menu.children);
    //if (Math.random()>.8){console.log(intersects);}

    if (intersects.length<=1) { //1 or less, because back and home buttons are on the 'panel'
      this.bButState = 0;
      this.hButState = 0;
      this.resetTweens();
    } else {
      intersects
      //.filter(intersectFilter => intersectFilter.object.name)
      .forEach((intersectedButton) => {
          //if (Math.random()>.8){console.log(intersectedButton,intersectedButton.object.name);}
          switch (intersectedButton.object.name) {
            case 'backButton':
              //console.log("back");
              if (this.bButState == 0) {
                //activate
                //console.log("BACK");
                this.bButState = 1;
                this.triggerBackRoom();
              }
              break;
            case 'homeButton':
              //console.log("HOME");
              if (this.hButState == 0) {
                //activate
                //console.log("HOME");
                this.hButState = 1;
                this.triggerHomeRoom();
              }
              break;
          }
      })
    }
  }


  triggerBackRoom () {
    this.tweenBackActivate = new TWEEN.Tween(this.backButtonMesh.scale).to({
        x: 0.001, y: 0.001, z: 0.001
    },THREE_CONST.HOTSPOT_DOOR_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      //console.log("Go Back:",this.goToBackRoom);
      TWEEN.remove(this.tweenBackActivate);
      this.goToBackRoom();
      //this.goToRoomFlag = true;
    }).start();
  }

  triggerHomeRoom () {
    this.tweenHomeActivate = new TWEEN.Tween(this.homeButtonMesh.scale).to({
        x: 0.001, y: 0.001, z: 0.001
    },THREE_CONST.HOTSPOT_DOOR_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      //console.log("Done scaling UP dash circle");
      TWEEN.remove(this.tweenHomeActivate);
      this.goToHomeRoom();
      //this.goToRoomFlag = true;
    }).start();
  }


  resetTweens() {
    if(this.tweenBackActivate) this.tweenBackActivate.stop();
    this.backButtonMesh.scale.set(1,1,1);
    //this.backButtonSprite.scale.set(1,1,1);
    if(this.tweenHomeActivate) this.tweenHomeActivate.stop();
    this.homeButtonMesh.scale.set(1,1,1);
  }

  getMeshList(): THREE.Mesh[] {
    return [this.backButtonMesh, this.homeButtonMesh];
  }

  getBackButton(): THREE.Mesh {
    return this.backButtonMesh;
  }

  getHomeButton(): THREE.Mesh {
    return this.homeButtonMesh;
  }

  destroy() {
    this.menu.children.forEach(child => {
      if (child.material && child.material.map) {
        child.material.map.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
      if (child.geometry) {
        child.geometry.dispose();
      }
    });
    this.menu = null;
  }

}
