import {Injectable} from '@angular/core';

import {SceneInteractor} from 'core/scene/sceneInteractor';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {EventBus} from 'ui/common/event-bus';

import {Text} from 'data/scene/entities/text';
import {Video} from 'data/scene/entities/video';
import {Audio} from 'data/scene/entities/audio';
import {Image} from 'data/scene/entities/image';
import {Door} from 'data/scene/entities/door';
import {Room} from 'data/scene/entities/room';
import {Link} from 'data/scene/entities/link';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';

@Injectable()
export class PropertyRemovalService {

  constructor(
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus
  ) {}

  removeProperty(roomProperty: RoomProperty) {
    const propertyType: string = RoomPropertyTypeService.getTypeString(roomProperty);
    this.removePropertyStrategy(propertyType, roomProperty);
  }

  private removePropertyStrategy(propertyType: string, roomProperty: RoomProperty) {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const removalStrategy = {
      text: () => {
        const text: Text = <Text> roomProperty;
        this.sceneInteractor.removeText(roomId, text);
        this.onDeselect();
      },
      video: () => {
        const video: Video = <Video> roomProperty;
        this.sceneInteractor.removeVideo(roomId, video);
        this.onDeselect();
      },
      audio: () => {
        const audio: Audio = <Audio> roomProperty;
        this.sceneInteractor.removeAudio(roomId, audio);
        this.onDeselect();
      },
      image: () => {
        const image: Image = <Image> roomProperty;
        this.sceneInteractor.removeImage(roomId, image);
        this.onDeselect();
      },
      door: () => {
        const door: Door = <Door> roomProperty;
        this.sceneInteractor.removeDoor(roomId, door);
        this.onDeselect();
      },
      room: () => {
        const removeRoomId: string = roomProperty.getId();
        this.sceneInteractor.removeRoom(removeRoomId);

        const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
        this.eventBus.onSelectRoom(activeRoomId, false);
      },
      link: () => {
        const link: Link = <Link> roomProperty;
        this.sceneInteractor.removeLink(roomId, link);
        this.onDeselect();
      },
    };
    removalStrategy[propertyType]();
  }

  private onDeselect() {
    this.eventBus.onSelectProperty(null, false);
    this.eventBus.onHotspotVisibility(false);
  }

}
