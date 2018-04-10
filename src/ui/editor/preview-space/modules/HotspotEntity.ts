import * as THREE from 'three';

import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {Door} from 'data/scene/entities/door';
import {THREE_CONST} from 'ui/common/constants';

const TWEEN = require('@tweenjs/tween.js');

export default class HotspotEntity {

  id: string; //THREE.js mesh id
  hotpostProperty: RoomProperty; //unique id for hotspot from YAML story file
  graphicIcon: THREE.Mesh; // this is a png of the door, sound, text etc
  //previewIcon: THREE.Line; // dash circle
  previewIcon: THREE.Group;
  rotation: THREE.Vector3;
  label: THREE.Mesh;
  yamlId: string;
  type: string;
  distanceToReticle: number;
  activeState: number; //0 for far, 1 for near, 2 for active
  activeStateLast: number;
  plane: THREE.Mesh;  // this is for hotspots that grow and how you something, like text/image/link
  audioPlayService: AudioPlayService;
  goToRoom: Function;
  myWobble: number;
  scale: number;

  private tweenIconActivate;
  private tweenIconDeactiveate;
  private tweenAudioActivate;
  private tweenDoorActivate;
  private tweenPlaneActivate;
  private tweenPlaneDeactivate;
  private tweenPreviewIconIn;
  private tweenPreviewIconOut;
  private tweenGraphicIconin;
  private tweenGraphicIconOut;
  private tweenLast;

  constructor(id, hotpostProperty, graphicIcon, previewIcon, audioPlayService, goToRoom, label, rotation) {
    this.id = id;
    this.hotpostProperty = hotpostProperty;
    this.yamlId = hotpostProperty.getId();
    this.type = RoomPropertyTypeService.getTypeString(hotpostProperty); //get hotspot type form oribginal RoomProperty
    this.graphicIcon = graphicIcon;
    this.previewIcon = previewIcon;
    this.audioPlayService = audioPlayService;
    this.goToRoom = goToRoom;
    this.activeState = 0; //everybody starts far away
    this.activeStateLast = -1; //to make sure something happens the first time
    this.scale = this.previewIcon.scale.x;
    this.graphicIcon.visible = true;
    this.previewIcon.visible = true;
    this.myWobble = Math.random() / 1000; //to make each hotspot have a uniquye throbbing freq
    this.label = label;
    this.rotation = rotation;
  }

  update(reticlePos) {
    let hotspotPosition: THREE.Vector3 = new THREE.Vector3();
    this.graphicIcon.getWorldPosition(hotspotPosition)
    this.distanceToReticle = hotspotPosition.distanceTo(reticlePos);
    if (this.distanceToReticle > THREE_CONST.HOTSPOT_NEAR) {
      this.activeState = 0;
    }
    else if ((this.distanceToReticle < THREE_CONST.HOTSPOT_NEAR)
      && (this.distanceToReticle > THREE_CONST.HOTSPOT_ACTIVE)) {
      this.activeState = 1;
    }
    else if (this.distanceToReticle < THREE_CONST.HOTSPOT_ACTIVE) {
      this.activeState = 2;
    }

    if (this.activeState !== this.activeStateLast) {
      //console.log("state: ",this.activeState);
      //console.log("this.activeStateLast: ",this.activeStateLast);
      switch (this.activeState) {
        case 0:
          //far away
          //console.log("trying graphic2preview");
          switch (this.activeStateLast) {
            case 1:
              //switch from preview to graphic
              this.resetTweens();
              this.graphic2preview();
              break;
            case 2:
              //switch from graphic to preview + deactivate
              //console.log('state 2>1');
              this.resetTweens();
              this.graphic2preview();
              this.deactivate();
              break;
          }
          break;
        case 1:
          switch (this.activeStateLast) {
            case 0:
              //switch from preview to graphic
              this.resetTweens();
              this.preview2graphic();
              break;
            case 2:
              //switch from graphic to preview + deactivate
              this.resetTweens();
              this.deactivate();
              this.preview2graphic();
              break;
          }
          break;
        case 2:
          // activate
          //this.resetTweens();
          this.activate();
          break;
      }

      //console.log("setting last to now");
      this.activeStateLast = this.activeState;
    }
    //animations
    if (this.activeState == 0) {
      if (this.type == 'door') {
        var previewIconScale = (1. - (performance.now() % THREE_CONST.HOTSPOT_DOOR_FREQ) / THREE_CONST.HOTSPOT_DOOR_FREQ)
          + 0.01;

        //if (Math.random() > .95) {console.log(previewIconScale);}
        this.previewIcon.scale.set(
          this.scale * previewIconScale,
          this.scale * previewIconScale,
          1);
        // var previewIconScale = (0.5+0.5*Math.sin(performance.now()*
        //     (THREE_CONST.HOTSPOT_MOD_FREQ+this.myWobble)));
        //     this.previewIcon.scale.set(
        //       previewIconScale,
        //       previewIconScale,
        //       1);
      } else {

        var previewIconScale = (Math.sin(performance.now() *
          (THREE_CONST.HOTSPOT_MOD_FREQ + this.myWobble)) * THREE_CONST.HOTSPOT_MOD_MAG);
        this.previewIcon.scale.set(
          this.previewIcon.scale.x + previewIconScale,
          this.previewIcon.scale.y + previewIconScale,
          1);
      }

      //trying to make door dashedlines rotate but not working
      // if (this.type != 'door') {
      //   this.previewIcon.rotation.x = Math.PI * Math.sin(performance.now()*THREE_CONST.HOTSPOT_ROT_FREQ);
      //   this.previewIcon.rotateOnAxis(this.previewIcon.position,
      //    Math.PI * Math.sin(performance.now()*THREE_CONST.HOTSPOT_ROT_FREQ));
      // }
    }
  }

  resetTweens() {
    if (this.tweenIconActivate) {
      this.tweenIconActivate.stop();
    }
    if (this.tweenIconDeactiveate) {
      this.tweenIconDeactiveate.stop();
    }
    if (this.tweenAudioActivate) {
      this.tweenAudioActivate.stop();
    }
    if (this.tweenDoorActivate) {
      this.tweenDoorActivate.stop();
    }
    if (this.tweenPlaneActivate) {
      this.tweenPlaneActivate.stop();
    }
    if (this.tweenPreviewIconIn) {
      this.tweenPreviewIconIn.stop();
    }
    if (this.tweenPreviewIconOut) {
      this.tweenPreviewIconOut.stop();
    }
    if (this.tweenGraphicIconin) {
      this.tweenGraphicIconin.stop();
    }
    if (this.tweenGraphicIconOut) {
      this.tweenGraphicIconOut.stop();
    }
    this.graphicIcon.scale.set(1, 1, 1);
  }

  activate() {
    switch (this.type) {
      case 'image':
      case 'text':
      case 'link':
      case 'video':
        //grow the plane
        this.plane.visible = true;
        this.tweenPlaneActivate = new TWEEN.Tween(this.plane.scale).to({
          x: THREE_CONST.TWEEN_PLANE_SCALE,
          y: THREE_CONST.TWEEN_PLANE_SCALE,
          z: 1
        }, THREE_CONST.TWEEN_PLANE_IN).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
          //console.log("updaing plane scale to", this.plane.scale);
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenPlaneActivate);
        }).start();

        //hide the icon
        this.tweenIconActivate = new TWEEN.Tween(this.graphicIcon.material).to({
          opacity: 0
        }, THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenIconActivate);
          this.graphicIcon.visible = false;
          this.label.visible = false;
        }).start();
        //console.log('image text link', this.id);
        //is this happening
        break;

      case 'audio':
        // do audio stuff
        this.tweenAudioActivate = new TWEEN.Tween(this.graphicIcon.scale).to({
          x: 0.001, y: 0.001, z: 0.001
        }, THREE_CONST.HOTSPOT_AUDIO_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenAudioActivate);
          this.graphicIcon.visible = false;
          this.graphicIcon.scale.set(1, 1, 1);
          this.audioPlayService.playHotspotAudio(this.yamlId);
          //this.goToRoomFlag = true;
        }).start();
        break;

      //console.log('play audio', this.id)

      case 'door':
        // do door stuff
        //console.log('activating door');
        const outgoingRoomId = (<Door>this.hotpostProperty).getRoomId();
        //this.goToRoom(outgoingRoomId);

        this.tweenDoorActivate = new TWEEN.Tween(this.graphicIcon.scale).to({
          x: 0.001, y: 0.001, z: 0.001
        }, THREE_CONST.HOTSPOT_DOOR_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenDoorActivate);
          this.graphicIcon.visible = false;
          this.label.visible = false;
          this.graphicIcon.scale.set(1, 1, 1);
          this.goToRoom(outgoingRoomId, this.graphicIcon.position);
          //this.goToRoomFlag = true;
        }).start();
      default:
      //console.log('missed case statement', this);
    }
  }

  deactivate() {
    switch (this.type) {
      case 'image':
      case 'text':
      case 'link':
      case 'video':
        //console.log('deactivating',this.type);
        this.tweenPlaneDeactivate = new TWEEN.Tween(this.plane.scale).to({
          x: .001, y: .001, z: 1
        }, THREE_CONST.TWEEN_PLANE_OUT).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          this.plane.visible = false;
          TWEEN.remove(this.tweenPlaneActivate);
        }).start();

        //show the icon
        //this.graphicIcon.visible= true;
        this.graphicIcon.visible = true;
        this.tweenIconDeactiveate = new TWEEN.Tween(this.graphicIcon.material).to({
          opacity: 1
        }, THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
        }).onComplete(() => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenIconDeactiveate);
        }).start();

        break;
      case 'audio':
        // do audio stuff
        break;
      case 'door':
        // do door stuff
        break;
      default:
      //console.log('missed case statement', this);
    }
  }

  graphic2preview() {
    //stop tweens counter to this function
    if (this.tweenPreviewIconOut) {
      this.tweenPreviewIconOut.stop();
    }
    if (this.tweenGraphicIconin) {
      this.tweenGraphicIconin.stop();
    }

    this.label.visible = false;
    //start new tweens
    this.previewIcon.visible = true;
    this.tweenPreviewIconIn = new TWEEN.Tween(this.previewIcon.scale).to({
      x: 1,
      y: 1,
      z: 1
    }, THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    }).onComplete(() => {
      //console.log("Done scaling UP dash circle");
      TWEEN.remove(this.tweenPreviewIconIn);
    }).start();

    //fade out the icon
    this.tweenGraphicIconOut = new TWEEN.Tween(this.graphicIcon.material).to({
      opacity: 0
    }, THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    }).onComplete(() => {
      this.graphicIcon.visible = false;
      //console.log("Done fading out icon");
      TWEEN.remove(this.tweenGraphicIconOut);
    }).start();
  }

  preview2graphic() {
    //stop tweens counter to this function
    if (this.tweenPreviewIconIn) {
      this.tweenPreviewIconIn.stop();
    }
    if (this.tweenGraphicIconOut) {
      this.tweenGraphicIconOut.stop();
    }

    //start new tweens
    this.tweenPreviewIconOut = new TWEEN.Tween(this.previewIcon.scale).to({
      x: 0.001,
      y: 0.001,
      z: 0.001
    }, THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    }).onComplete(() => {
      this.previewIcon.visible = false;
      TWEEN.remove(this.tweenPreviewIconOut);
      //console.log("Done scaling UP dash circle");
    }).start();
    //fade in the icon
    //this.graphicIcon.visible = true;
    this.graphicIcon.visible = true;
    this.tweenGraphicIconin = new TWEEN.Tween(this.graphicIcon.material).to({
      opacity: 1
    }, THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    }).onComplete(() => {
      //console.log("Done fading in icon");
      this.label.visible = true;
      TWEEN.remove(this.tweenGraphicIconin);
    }).start();
  }
}
