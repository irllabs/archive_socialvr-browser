import {Video} from "data/scene/entities/video";
import {Universal} from "data/scene/entities/universal";
import {Link} from "data/scene/entities/link";
import {Image} from "data/scene/entities/image";
import {Text} from "data/scene/entities/text";
import {Audio} from "data/scene/entities/audio";
import {Door} from "data/scene/entities/door";
import ImagePlane from "./image-plane"
import TextPlane from "./text-plane"
import VideoPlane from "./video-plane"
import UniversalPlane from "./universal-plane"
import LinkPlane from "./link-plane"
import AudioPlane from "./audio-plane"
import DoorPlane from "./door-plane"
import * as THREE from "three";
import {RoomPropertyTypeService} from "../../util/roomPropertyTypeService";
import {AssetInteractor} from "core/asset/assetInteractor";


export default class PlaneResolver {
  static resolve(roomProperty: any, camera: THREE.PerspectiveCamera, assetInteractor: AssetInteractor, services: any) {
    switch (RoomPropertyTypeService.getTypeString(roomProperty)) {
        case 'image': {
          return new ImagePlane(roomProperty as Image, camera, assetInteractor);
        }
        case 'text': {
          return new TextPlane(roomProperty as Text, camera, assetInteractor);
        }
        case 'video': {
          return new VideoPlane(roomProperty as Video, camera, assetInteractor);
        }
        case 'universal': {
          const plane = new UniversalPlane(roomProperty as Universal, camera, assetInteractor);

          plane.init(services.audioPlayService);

          return plane;
        }
        case 'link': {
          return new LinkPlane(roomProperty as Link, camera, assetInteractor);
        }
        case 'audio': {
          const plane = new AudioPlane(roomProperty as Audio, camera, assetInteractor);

          plane.init(services.audioPlayService);

          return plane;
        }
        case 'door': {
          const plane = new DoorPlane(roomProperty as Door, camera, assetInteractor);

          plane.init(services.position, services.goToRoom);

          return plane;
        }
      }
  }
}
