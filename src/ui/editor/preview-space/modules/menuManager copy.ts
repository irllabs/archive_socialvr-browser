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
  private homeButtonMesh: THREE.Mesh;
  private panelMesh: THREE.Mesh;
  private backButtonPt: THREE.Vector3 = new THREE.Vector3();
  private homeButtonPt: THREE.Vector3 = new THREE.Vector3();
  private panelPt: THREE.Vector3 = new THREE.Vector3();
  private goToBackRoom: Function;
  private goToHomeRoom: Function;
  private menuToReticle: Number;
  private homeToReticle: Number;
  private backToReticle: Number;
  private hPos: THREE.Vector3;
  private bPos: THREE.Vector3;
  private hButState: number; //0 means far, 1 means active
  private bButState: number; //0 means far, 1 means active
  //private hButStateLast: number; //0 means far, 1 means active
  //private bButStateLast: number; //0 means far, 1 means active
  private tweenHomeActivate: any;
  private tweenBackActivate: any;

  constructor(
    private assetInteractor: AssetInteractor
  ) {}

  load(scene: THREE.Scene, cameraPosition: THREE.Vector3, goToBackRoom: Function, goToHomeRoom: Function) {
    //console.log("this.menu: ", this.menu);
    //if (this.menu) {return}; //don't remake the menu if it's already there
    //functions for homeroom and last room
    this.goToBackRoom = goToBackRoom;
    this.goToHomeRoom = goToHomeRoom;
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
    this.menu.add(panelMesh);
    panelMesh.position.set(0,0,0);
    this.panelMesh = panelMesh;

    //back button
    const backBtnGeometry = new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM); //need THREE global
    const backBtnTexture = this.assetInteractor.getTextureById('back');
    const backBtnMaterial = new THREE.MeshBasicMaterial({map: backBtnTexture, transparent: true, side:THREE.FrontSide});
    const backBtnMesh = new THREE.Mesh(backBtnGeometry, backBtnMaterial);
    this.menu.add(backBtnMesh);

    this.backButtonPt = new THREE.Vector3(-40,0,
          THREE_CONST.CAMERA_HOTSPOT - THREE_CONST.CAMERA_NAVPANEL);
    backBtnMesh.position.set(this.backButtonPt.x, this.backButtonPt.y, this.backButtonPt.z);

    //backBtnMesh.lookAt(cameraPosition);
    backBtnMesh.name = 'backButton';
    this.backButtonMesh = backBtnMesh;

    // //add point at center of back button
    // const backBtnPtGeometry = new THREE.Geometry();
    // backBtnPtGeometry.vertices.push(new THREE.Vector3(-40,0,
    //       THREE_CONST.CAMERA_HOTSPOT - THREE_CONST.CAMERA_NAVPANEL));
    // var backBtnPtMaterial = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );
    // this.backButtonPt = new THREE.Points( backBtnPtGeometry, backBtnPtMaterial );
    // this.menu.add( this.backButtonPt );

    //home button
    const homeBtnGeometry = new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
    const homeBtnTexture = this.assetInteractor.getTextureById('home');
    const homeBtnMaterial = new THREE.MeshBasicMaterial({map: homeBtnTexture, transparent: true, side:THREE.FrontSide});
    const homeBtnMesh = new THREE.Mesh(homeBtnGeometry, homeBtnMaterial);
    this.menu.add(homeBtnMesh);

    this.homeButtonPt = new THREE.Vector3(40,0,
          THREE_CONST.CAMERA_HOTSPOT - THREE_CONST.CAMERA_NAVPANEL);
    homeBtnMesh.position.set(this.homeButtonPt.x, this.homeButtonPt.y, this.homeButtonPt.z);

    //homeBtnMesh.lookAt(cameraPosition);
    homeBtnMesh.name = 'homeButton';
    this.homeButtonMesh = homeBtnMesh;

    //add menu to scene
    this.menu.lookAt(cameraPosition);
    scene.add(this.menu);

    //var bPosA = this.menu.position.clone().add(this.backButtonMesh.position);
    //var hPos = this.menu.position.clone().add(this.homeButtonMesh.position);
    //var bPos = this.backButtonMesh.getWorldPosition();
    //var hPos = this.homeButtonMesh.getWorldPosition();


    //this is required for .localToWorld to work properly
    this.menu.updateMatrixWorld(true);

    //get world coordinates for buttons; .getWorldPosition doesn't work!!!
    //var bPosP = this.menu.localToWorld( this.backButtonPt );
    //var hPosP = this.menu.localToWorld( this.homeButtonPt );
    var bPos = this.menu.localToWorld( this.backButtonMesh.position );
    this.backButtonMesh.getWorldPosition(this.backButtonPt);
    var hPos = this.menu.localToWorld( this.homeButtonMesh.position );
    this.homeButtonMesh.getWorldPosition(this.homeButtonPt);
    var pPos = this.menu.localToWorld( this.panelMesh.position );
    this.panelMesh.getWorldPosition(this.panelPt);

    let menuPos: THREE.Vector3 = new THREE.Vector3();
    this.menu.getWorldPosition(menuPos);

    var panPos = new THREE.Vector3();
    panPos.setFromMatrixPosition( this.panelMesh.matrixWorld );
    
    //debugging
    var g1 = new THREE.SphereGeometry( 5, 32, 32 );
    var m1 = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var s1 = new THREE.Mesh( g1, m1 );
    s1.position.set(this.backButtonPt.x, this.backButtonPt.y, this.backButtonPt.z);
    scene.add( s1 );

    var g2 = new THREE.SphereGeometry( 5, 32, 32 );
    var m2 = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    var s2 = new THREE.Mesh( g2, m2 );
    s2.position.set(this.homeButtonPt.x, this.homeButtonPt.y, this.homeButtonPt.z);
    scene.add( s2 );

    var g3 = new THREE.SphereGeometry( 5, 32, 32 );
    var m3 = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
    var s3 = new THREE.Mesh( g3, m3 );
    s3.position.set(this.panelPt.x, this.panelPt.y, this.panelPt.z);
    scene.add( s3 );

    var g4 = new THREE.SphereGeometry( 5, 32, 32 );
    var m4 = new THREE.MeshBasicMaterial( {color: 0xfffa00} );
    var s4 = new THREE.Mesh( g4, m4 );
    s4.position.set(menuPos.x-2, menuPos.y-2, menuPos.z);
    scene.add( s4 );

  }


  update(reticle, camera: THREE.PerspectiveCamera) {
    //const menuPos = this.menu.position.clone();
    let retPos: THREE.Vector3 = new THREE.Vector3();
    reticle.getWorldPosition(retPos);
    this.menuToReticle = this.panelPt.distanceTo(retPos);
    //console.log(this.menuToReticle);

    if (this.menuToReticle > THREE_CONST.NAVEPANEL_NEAR) {  //need THREE global
      //drag the menu along with the reticle
      //this.menu.lookAt(camera.position);
      //console.log('menu far');
      this.hButState = 0;
      this.bButState = 0;
      this.resetTweens();

    } else {
      //console.log('menu close');
      //console.log("within menu");
      var bDist = this.backButtonPt.distanceTo(retPos);
      var hDist = this.homeButtonPt.distanceTo(retPos);
    }

    if (bDist < THREE_CONST.NAVEBUTT_ACTIVE) {
      console.log("back");
        if (this.bButState == 0) {
          //activate
          console.log("BACK");
          this.bButState = 1;
          this.triggerBackRoom();
        }
    }

    if (hDist < THREE_CONST.NAVEBUTT_ACTIVE) {
      console.log("back");
        if (this.hButState == 0) {
          //activate
          console.log("HOME");
          this.hButState = 1;
          this.triggerHomeRoom();
        }
    }

  }


    triggerBackRoom () {
      this.tweenBackActivate = new TWEEN.Tween(this.backButtonMesh.scale).to({
          x: 0.001, y: 0.001, z: 0.001
      },THREE_CONST.HOTSPOT_DOOR_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
      }).onComplete( () => {
        //console.log("Done scaling UP dash circle");
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

}
