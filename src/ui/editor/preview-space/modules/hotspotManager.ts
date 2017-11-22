import {Injectable} from '@angular/core';

import IdMeshPair from 'ui/editor/preview-space/modules/idMeshPair';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';
import {RoomManager} from 'data/scene/roomManager';
import {MenuManager} from 'ui/editor/preview-space/modules/menuManager';
import {Image} from 'data/scene/entities/image';
import {Text} from 'data/scene/entities/text';
import {Link} from 'data/scene/entities/link';
import {Audio} from 'data/scene/entities/audio';
import {Door} from 'data/scene/entities/door';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {buildMaterialFromText} from 'ui/editor/preview-space/modules/textMaterialBuilder';
import {fitToMax} from 'data/util/imageResizeService';
import {getCoordinatePosition} from 'ui/editor/util/iconPositionUtil';
import {EventBus} from 'ui/common/event-bus';
import * as MeshUtil from 'ui/editor/preview-space/modules/meshUtil';
import {sphericalToCoordinate, coordinateToSpherical, car2pol, pol2car} from 'ui/editor/util/iconPositionUtil';
import {THREE_CONST} from 'ui/common/constants';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';

const TWEEN = require('@tweenjs/tween.js');

class HotspotEntity {

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
  activeStateLast : number;
  plane: THREE.Mesh;  // this is for hotspots that grow and how you something, like text/image/link
  audioPlayService: AudioPlayService;
  goToRoom: Function;
  myWobble: number;
  scale: number;
  //tweens:

  tweenIconActivate;
  tweenIconDeactiveate;
  tweenAudioActivate;
  tweenDoorActivate;
  tweenPlaneActivate
  tweenPlaneDeactivate;
  tweenPreviewIconIn;
  tweenPreviewIconOut;
  tweenGraphicIconin;
  tweenGraphicIconOut;

  tweenLast;

  //

  constructor(id, hotpostProperty, graphicIcon,previewIcon, audioPlayService, goToRoom, label, rotation) {
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
    this.myWobble = Math.random()/1000; //to make each hotspot have a uniquye throbbing freq
    this.label = label;
    this.rotation = rotation;
  }

  update(reticlePos) {
    const hotspotPosition = this.graphicIcon.getWorldPosition();
    this.distanceToReticle = hotspotPosition.distanceTo(reticlePos);
    //console.log("distance: ",this.distanceToReticle);
    if (this.distanceToReticle > THREE_CONST.HOTSPOT_NEAR)
      {this.activeState = 0;}
    else if ((this.distanceToReticle < THREE_CONST.HOTSPOT_NEAR)
        && (this.distanceToReticle > THREE_CONST.HOTSPOT_ACTIVE))
      {this.activeState = 1;}
    else if (this.distanceToReticle < THREE_CONST.HOTSPOT_ACTIVE)
      {this.activeState = 2;}

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
        var previewIconScale = (1.-(performance.now()%THREE_CONST.HOTSPOT_DOOR_FREQ)/THREE_CONST.HOTSPOT_DOOR_FREQ)
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

        var previewIconScale = (Math.sin(performance.now()*
            (THREE_CONST.HOTSPOT_MOD_FREQ+this.myWobble))*THREE_CONST.HOTSPOT_MOD_MAG);
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
    if(this.tweenIconActivate) {this.tweenIconActivate.stop();}
    if(this.tweenIconDeactiveate) {this.tweenIconDeactiveate.stop();}
    if(this.tweenAudioActivate) {this.tweenAudioActivate.stop();}
    if(this.tweenDoorActivate) {this.tweenDoorActivate.stop();}
    if(this.tweenPlaneActivate) {this.tweenPlaneActivate.stop();}
    if(this.tweenPreviewIconIn) {this.tweenPreviewIconIn.stop();}
    if(this.tweenPreviewIconOut) {this.tweenPreviewIconOut.stop();}
    if(this.tweenGraphicIconin) {this.tweenGraphicIconin.stop();}
    if(this.tweenGraphicIconOut) {this.tweenGraphicIconOut.stop();}
    this.graphicIcon.scale.set(1,1,1);
  }

  activate() {
    switch (this.type) {
      case 'image':
      case 'text':
      case 'link':
        //grow the plane
        this.plane.visible = true;
        this.tweenPlaneActivate = new TWEEN.Tween(this.plane.scale).to({
            x: THREE_CONST.TWEEN_PLANE_SCALE,
            y: THREE_CONST.TWEEN_PLANE_SCALE,
            z:1
        },THREE_CONST.TWEEN_PLANE_IN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
          //console.log("updaing plane scale to", this.plane.scale);
        }).onComplete( () => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenPlaneActivate);
        }).start();

        //hide the icon
        this.tweenIconActivate = new TWEEN.Tween(this.graphicIcon.material).to({
            opacity: 0
        },THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
        }).onComplete( () => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenIconActivate);
          this.graphicIcon.visible= false;
          this.label.visible = false;
        }).start();
        //console.log('image text link', this.id);
        //is this happening
        break;

      case 'audio':
        // do audio stuff
        this.tweenAudioActivate = new TWEEN.Tween(this.graphicIcon.scale).to({
            x: 0.001, y: 0.001, z: 0.001
        },THREE_CONST.HOTSPOT_AUDIO_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
        }).onComplete( () => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenAudioActivate);
          this.graphicIcon.visible = false;
          this.graphicIcon.scale.set(1,1,1);
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
        },THREE_CONST.HOTSPOT_DOOR_DELAY).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
        }).onComplete( () => {
          //console.log("Done scaling UP dash circle");
          TWEEN.remove(this.tweenDoorActivate);
          this.graphicIcon.visible = false;
          this.label.visible = false;
          this.graphicIcon.scale.set(1,1,1);
          this.goToRoom(outgoingRoomId,this.graphicIcon.position);
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
        //console.log('deactivating',this.type);
        this.tweenPlaneDeactivate = new TWEEN.Tween(this.plane.scale).to({
            x: .001, y:.001, z:1
        },THREE_CONST.TWEEN_PLANE_OUT).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
        }).onComplete( () => {
          //console.log("Done scaling UP dash circle");
          this.plane.visible = false;
          TWEEN.remove(this.tweenPlaneActivate);
        }).start();

        //show the icon
        //this.graphicIcon.visible= true;
        this.graphicIcon.visible= true;
        this.tweenIconDeactiveate = new TWEEN.Tween(this.graphicIcon.material).to({
            opacity: 1
        },THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
        }).onComplete( () => {
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

  graphic2preview(){
    //stop tweens counter to this function
    if(this.tweenPreviewIconOut){this.tweenPreviewIconOut.stop();}
    if(this.tweenGraphicIconin){this.tweenGraphicIconin.stop();}

    this.label.visible = false;
    //start new tweens
    this.previewIcon.visible = true;
    this.tweenPreviewIconIn = new TWEEN.Tween(this.previewIcon.scale).to({
        x: 1,
        y: 1,
        z: 1
    },THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      //console.log("Done scaling UP dash circle");
      TWEEN.remove(this.tweenPreviewIconIn);
    }).start();

    //fade out the icon
    this.tweenGraphicIconOut = new TWEEN.Tween(this.graphicIcon.material).to({
        opacity: 0
    },THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      this.graphicIcon.visible = false;
      //console.log("Done fading out icon");
      TWEEN.remove(this.tweenGraphicIconOut);
    }).start();
  }

  preview2graphic(){
    //stop tweens counter to this function
    if(this.tweenPreviewIconIn) {this.tweenPreviewIconIn.stop();}
    if(this.tweenGraphicIconOut) {this.tweenGraphicIconOut.stop();}

    //start new tweens
    this.tweenPreviewIconOut = new TWEEN.Tween(this.previewIcon.scale).to({
        x: 0.001,
        y: 0.001,
        z: 0.001
    },THREE_CONST.TWEEN_ICON_OUT).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      this.previewIcon.visible = false;
      TWEEN.remove(this.tweenPreviewIconOut);
      //console.log("Done scaling UP dash circle");
    }).start();
    //fade in the icon
    //this.graphicIcon.visible = true;
    this.graphicIcon.visible = true;
    this.tweenGraphicIconin = new TWEEN.Tween(this.graphicIcon.material).to({
        opacity: 1
    },THREE_CONST.TWEEN_ICON_IN).easing(TWEEN.Easing.Linear.None).onUpdate( () => {
    }).onComplete( () => {
      //console.log("Done fading in icon");
      this.label.visible = true;
      TWEEN.remove(this.tweenGraphicIconin);
    }).start();
  }
}




function buildDashCircle(): THREE.Line {
  const dashCircleGeom = new THREE.CircleGeometry( THREE_CONST.HOTSPOT_DIM, THREE_CONST.DASHCIRCLE_SEG );
  const dashCircleMaterial = new THREE.LineDashedMaterial( { color: 0xFFFFFF, dashSize: 2, gapSize: 2, linewidth:1  } );
  dashCircleGeom.vertices.shift();
  dashCircleGeom.computeLineDistances();
  return new THREE.Line(dashCircleGeom,dashCircleMaterial);;
}

@Injectable()
export class HotspotManager {

  //String is the THREE.js unique id of the hotspot mesh
  private hotspotMap: Map<String, HotspotEntity> = new Map();
  private activateHotspotTimeout: number;
  private doorTimerMesh: THREE.Mesh;
  private doorTimerTheta: number = 0;
  private buildTimerMesh: Function;
  private doorTimerCleaner: Function;
  private tempOutgoingRoomId: string = '';
  private lastRoomId: string = '';
  private onRoomChange: Function;
  private activeHotspotId: string = '';
  private dashCircleLine: THREE.Line;

  constructor(
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private audioPlayService: AudioPlayService,
    private roomManager: RoomManager,
    private menuManager: MenuManager,
    private eventBus: EventBus
  ) {}

  load(scene: THREE.Scene, camera: THREE.PerspectiveCamera, onRoomChange: Function) {
    this.onRoomChange = onRoomChange;
    this.dashCircleLine = buildDashCircle();
    this.cleanMaps(scene);


    // Hotspot Icons - add preview and graphic icons to the scene, create map
    const roomId: string  = this.sceneInteractor.getActiveRoomId();
    this.sceneInteractor.getRoomProperties(roomId).forEach(roomProperty => {

      const location = roomProperty.getLocation();
      //console.log(roomProperty);
      const position = getCoordinatePosition(location.getX(), location.getY());
      //console.log('position', position);
      const labelText = roomProperty.getName();
      const propertyType: string = RoomPropertyTypeService.getTypeString(roomProperty);
      const squareGeometry = new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
      const hotspotTexture = this.assetInteractor.getTextureById(propertyType);

      //create graphic icon for hotspot, i.e. our hotspot icons
      const squareMaterial = new THREE.MeshBasicMaterial({map: hotspotTexture,  transparent: true, side:THREE.FrontSide});
      const squareMesh = new THREE.Mesh(squareGeometry, squareMaterial);
      var polPol = car2pol(position.x, position.y, position.z);
      var posCar = pol2car(THREE_CONST.CAMERA_HOTSPOT,polPol.y,polPol.z);
      squareMesh.position.set(posCar.x, posCar.y, posCar.z);
      squareMesh.lookAt(camera.position);
      squareMesh.material.opacity = 0;
      scene.add(squareMesh);
      var meshRotation = squareMesh.position;

      //create preview icon for hotspot, i.e. dash circle
      const dashCircle: THREE.Line = this.dashCircleLine.clone();
      var dashCircleGroup = new THREE.Group();
      dashCircleGroup.add(dashCircle);
      dashCircleGroup.position.set(position.x, position.y, position.z);
      dashCircleGroup.lookAt(camera.position);
      dashCircleGroup.visible = true;
      scene.add( dashCircleGroup );

      //create label for each hotpost, i.e. the name of the hotspotEntity
      const fontProperties = {
        font: fontHelper.getBaseFont(),
    		size: THREE_CONST.FONT_HOTSPOT_SIZE,
    		height: THREE_CONST.FONT_HOTSPOT_HEIGHT,
    		curveSegments: 12,
    		bevelEnabled: false,
    		bevelThickness: 4,
    		bevelSize: 8,
    		bevelSegments: 5
      };
      const labelMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
      const labelGeometry = new THREE.TextGeometry(roomProperty.getName(), fontProperties);
      labelGeometry.computeBoundingBox();
      labelGeometry.computeVertexNormals();
      labelGeometry.center();
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(position.x, position.y - 40, position.z);
      labelMesh.lookAt(camera.position);
      labelMesh.visible = false;
      scene.add(labelMesh);

      //add to hotspotEntity map
      const thisHotspot = new HotspotEntity(squareMesh.uuid,roomProperty,squareMesh,dashCircleGroup, this.audioPlayService, onRoomChange, labelMesh, meshRotation);
      this.hotspotMap.set(squareMesh.uuid, thisHotspot);

      if (propertyType === 'image') {
        const imageProperty = roomProperty as Image;
        const imagePlane = this.buildExpandedImagePlane(imageProperty, camera);
        scene.add(imagePlane);
        this.hotspotMap.get(squareMesh.uuid).plane = imagePlane;
      }
      else if (propertyType === 'text') {
        const textProperty = roomProperty as Text;
        const textPlane = this.buildExpandedTextPlane(textProperty, camera);
        scene.add(textPlane);
        this.hotspotMap.get(squareMesh.uuid).plane = textPlane;
      }
      else if (propertyType === 'link') {
        const linkProperty = roomProperty as Link;
        const linkPlane = this.buildExpandedLinkPlane(linkProperty, camera);
        scene.add(linkPlane);
        this.hotspotMap.get(squareMesh.uuid).plane = linkPlane;
      }
    });

  }

  buildExpandedImagePlane(imageProperty: Image, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const imageTexture = this.assetInteractor.getTextureById(imageProperty.getId());
    if (imageTexture) {
      const location = imageProperty.getLocation();
      const position = getCoordinatePosition(location.getX(), location.getY(), 250);
      const geometryDimensions = fitToMax(imageTexture.image.width, imageTexture.image.height, 140);
      const imageGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
      //added by ali
      const imageMaterial = new THREE.MeshBasicMaterial({map: imageTexture, transparent: true, side:THREE.FrontSide, alphaMap: this.assetInteractor.getTextureById('imageMask')});
      const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
      imageMesh.position.set(position.x, position.y, position.z);
      imageMesh.lookAt(camera.position);
      imageMesh.material.opacity = 1;
      imageMesh.scale.set(0.001,0.001,0.001);
      return imageMesh;
    } else

    {return new THREE.Mesh();}
  }

  buildExpandedTextPlane(textProperty: Text, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const location = textProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materailData = buildMaterialFromText(textProperty.body);
    const geometryDimensions = fitToMax(materailData.width, materailData.height, 140);
    const textGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const textMesh = new THREE.Mesh(textGeometry, materailData.material);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(camera.position);
    textMesh.material.opacity = 1;
    textMesh.scale.set(0.001,0.001,0.001);
    return textMesh;
  }

  buildExpandedLinkPlane(linkProperty: Link, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const location = linkProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materailData = buildMaterialFromText(linkProperty.body);
    const geometryDimensions = fitToMax(materailData.width, materailData.height, 140);
    const linkGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const linkMesh = new THREE.Mesh(linkGeometry, materailData.material);
    linkMesh.position.set(position.x, position.y, position.z);
    linkMesh.lookAt(camera.position);
    linkMesh.material.opacity = 1;
    linkMesh.scale.set(0.001,0.001,0.001);
    return linkMesh;
  }

  cleanMaps(scene: THREE.Scene) {
    //clean up three.js scene
    this.hotspotMap.forEach(idHotspotPair => {
      //console.log("deleting: ",idHotspotPair);
      MeshUtil.cleanMeshMemory(idHotspotPair.graphicIcon);
      //MeshUtil.cleanMeshMemory(idHotspotPair.previewIcon);
      MeshUtil.cleanMeshMemory(idHotspotPair.plane);
      scene.remove(idHotspotPair.graphicIcon);
      scene.remove(idHotspotPair.previewIcon);
      scene.remove(idHotspotPair.plane);
    });


    //create new map to keep track of hotspots
    this.hotspotMap = new Map();

  }

  getMeshList(): THREE.Mesh[] {
    return Array.from(this.hotspotMap.values())
      .map(idMeshPair => idMeshPair.graphicIcon);
  }

  getHotspot(hotspotId: string): HotspotEntity {
    return this.hotspotMap.get(hotspotId);
  }

  update(reticle, elapsedTime: number) {

    const retPos = reticle.getWorldPosition();
    this.hotspotMap.forEach((hotspotEntity, id) => {
      hotspotEntity.update(retPos);
    });

  }

}
