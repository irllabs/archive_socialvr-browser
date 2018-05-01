import {Audio} from 'data/scene/entities/audio';
import {Video} from 'data/scene/entities/video';
import {Universal} from 'data/scene/entities/universal';
import {Image} from 'data/scene/entities/image';
import {Text} from 'data/scene/entities/text';
import {Door} from 'data/scene/entities/door';
import {Room} from 'data/scene/entities/room';
import {Link} from 'data/scene/entities/link';
import {Narrator} from 'data/scene/entities/narrator';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';

const typeMap = {
  audio: Audio,
  door: Door,
  image: Image,
  room: Room,
  text: Text,
  link: Link,
  video: Video,
  universal: Universal,
  narrator: Narrator
};

export class RoomPropertyTypeService {
  static getTypeString(roomProperty: RoomProperty): string {
    return Object.keys(typeMap).find(key => roomProperty instanceof typeMap[key]);
  }
}
