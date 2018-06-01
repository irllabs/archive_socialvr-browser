import { Injectable } from '@angular/core';
import { Audio } from 'data/scene/entities/audio';
import { Door } from 'data/scene/entities/door';
import { Image } from 'data/scene/entities/image';
import { Link } from 'data/scene/entities/link';
import { Narrator } from 'data/scene/entities/narrator';

import { Room } from 'data/scene/entities/room';
import { Text } from 'data/scene/entities/text';
import { Universal } from 'data/scene/entities/universal';
import { Vector2 } from 'data/scene/entities/vector2';
import { Video } from 'data/scene/entities/video';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { reverbList } from 'data/scene/values/reverbList';
import { resizeImage } from 'data/util/imageResizeService';

import { BACKGROUND_THUMBNAIL, DEFAULT_FILE_NAME, DEFAULT_IMAGE_PATH, DEFAULT_VOLUME } from 'ui/common/constants';
import { deserializeLocationVector } from '../util/vector';

@Injectable()
export class PropertyBuilder {
  public setBaseProperties(jsonData: any, roomProperty: RoomProperty): RoomProperty {
    const builtRoomProperty: RoomProperty = roomProperty
      .setId(jsonData.uuid)
      .setName(jsonData.name)
      .setTimestamp(jsonData.time);

    if (jsonData.vect) {
      const location: Vector2 = deserializeLocationVector(jsonData.vect);

      builtRoomProperty.setLocation(location);
    }
    return builtRoomProperty;
  }

  universal(name: string, textContent: string): Universal {
    const universal: Universal = new Universal();

    universal.setName(name);
    universal.textContent = textContent;
    universal.setAudioContent(null, DEFAULT_VOLUME);
    universal.setImageContent(null);

    return universal;
  }

  door(roomId: string, name: string): Door {
    const door: Door = new Door();
    door.setRoomId(roomId);
    door.setName(name);
    return door;
  }

  doorFromJson(doorJson: any): Door {
    const door: Door = <Door> this.setBaseProperties(doorJson, new Door());

    door.setRoomId(doorJson.file); // TODO: improve it
    door.setNameIsCustom(doorJson.nameIsCustom || false);
    door.setAutoTime(doorJson.autoTime !== undefined ? doorJson.autoTime : 0);

    return door;
  }

  room(name: string) {
    const room: Room = new Room();

    room.setName(name);
    room.setBackgroundImageBinaryData(DEFAULT_IMAGE_PATH);
    room.setThumbnail(DEFAULT_IMAGE_PATH);

    room.getBackgroundImage().setFileName(DEFAULT_FILE_NAME);

    return room;
  }
}
