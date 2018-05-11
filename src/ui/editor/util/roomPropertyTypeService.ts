import { Audio } from 'data/scene/entities/audio';
import { Door } from 'data/scene/entities/door';
import { Image } from 'data/scene/entities/image';
import { Link } from 'data/scene/entities/link';
import { Narrator } from 'data/scene/entities/narrator';
import { Room } from 'data/scene/entities/room';
import { Text } from 'data/scene/entities/text';
import { Universal } from 'data/scene/entities/universal';
import { Video } from 'data/scene/entities/video';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';

const typeMap = {
  audio: Audio,
  door: Door,
  image: Image,
  room: Room,
  text: Text,
  link: Link,
  video: Video,
  universal: Universal,
  narrator: Narrator,
};

export class RoomPropertyTypeService {
  static getTypeString(roomProperty: RoomProperty): string {
    return Object.keys(typeMap).find(key => roomProperty instanceof typeMap[key]);
  }
}
