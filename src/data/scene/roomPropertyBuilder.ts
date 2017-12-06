import { Injectable } from '@angular/core';

import {Room} from 'data/scene/entities/room';
import {Text} from 'data/scene/entities/text';
import {Image} from 'data/scene/entities/image';
import {Audio} from 'data/scene/entities/audio';
import {Door} from 'data/scene/entities/door';
import {Link} from 'data/scene/entities/link';
import {Narrator} from 'data/scene/entities/narrator';
import {Vector2} from 'data/scene/entities/vector2';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {resizeImage} from 'data/util/imageResizeService';
import {reverbList} from 'data/scene/values/reverbList';

import {DEFAULT_FILE_NAME, DEFAULT_IMAGE_PATH, BACKGROUND_THUMBNAIL, DEFAULT_VOLUME} from 'ui/common/constants';

@Injectable()
export class PropertyBuilder {

  private setBaseProperties(jsonData: any, roomProperty: RoomProperty): RoomProperty {
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

  text(name: string, body: string): Text {
    const text: Text = new Text();
    text.setName(name);
    text.body = body;
    return text;
  }

  textFromJson(textJson: any): Text {
    const text: Text = <Text> this.setBaseProperties(textJson, new Text());
    text.body = textJson.file;
    return text;
  }

  link(name: string, body: string): Link {
    const link: Link = new Link();
    link.setName(name);
    link.body = body;
    return link;
  }

  linkFromJson(linkJson: any): Link {
    const link: Link = <Link> this.setBaseProperties(linkJson, new Link());
    link.body = linkJson.file;
    return link;
  }

  audio(name: string): Audio {
    const audio: Audio = new Audio();
    audio.setName(name);
    audio.setFileData(DEFAULT_FILE_NAME, DEFAULT_VOLUME, null);
    return audio;
  }

  audioFromJson(audioJson: any, binaryFileData: string): Audio {
    const audio: Audio = <Audio> this.setBaseProperties(audioJson, new Audio());
    let fileName = decodeURIComponent(audioJson);
    if (audioJson.hasOwnProperty('file')) fileName = audioJson.file;
    const volume = audioJson.volume;
    audio.setFileData(fileName, volume, binaryFileData);
    return audio;
  }

  image(name: string): Image {
    const image: Image = new Image();
    image.setName(name);
    image.setFileData(DEFAULT_FILE_NAME, null);
    return image;
  }

  imageFromJson(imageJson: any, binaryFileData: string): Image {
    const image: Image = <Image> this.setBaseProperties(imageJson, new Image());
    const fileName = decodeURIComponent(imageJson.file);
    image.setFileData(fileName, binaryFileData);
    if (imageJson.hasOwnProperty('remoteFile')) {
      image.setRemoteFileName(imageJson.remoteFile);
    }
    return image;
  }

  door(roomId: string, name: string): Door {
    const door: Door = new Door();
    door.setRoomId(roomId);
    door.setName(name);
    return door;
  }

  doorFromJson(doorJson: any): Door {
    const door: Door = <Door> this.setBaseProperties(doorJson, new Door());
    door.setRoomId(doorJson.file);
    door.setNameIsCustom(doorJson.nameIsCustom || false);
    door.setAutoTime(doorJson.autoTime !== undefined ? doorJson.autoTime : 0);
    return door;
  }

  roomFromJson(roomJson: any, binaryFileData: string, thumbnail: string, backgroundAudioUrl): Room {
    const room: Room = <Room> this.setBaseProperties(roomJson, new Room());
    let imageName = decodeURIComponent(roomJson.image);
    if (roomJson.image.hasOwnProperty('file')) {
      imageName = roomJson.image.file;
    }
    const imageData = binaryFileData || DEFAULT_IMAGE_PATH;
    room.setFileData(imageName, imageData);

    if (thumbnail) {
      room.setThumbnail(BACKGROUND_THUMBNAIL, thumbnail);
    }
    else if (!thumbnail && binaryFileData){
      resizeImage(binaryFileData, 'projectThumbnail')
        .then(resizedImageData => {
          room.setThumbnail(BACKGROUND_THUMBNAIL, resizedImageData);
        })
        .catch(error => console.log('generate thumbnail error', error));
    }

    if (backgroundAudioUrl) {
      room.setBackgroundAudio(roomJson.ambient, roomJson.bgVolume, backgroundAudioUrl);
    }

    if (roomJson.front) {
      const location: Vector2 = deserializeLocationVector(roomJson.front);
      room.setLocation(location);
    }
    if (roomJson.video) {
      room.setBackgroundVideo('', roomJson.video);
    }

    room.setReverb(roomJson.reverb || reverbList[0]);

    return room;
  }

  room(name: string) {
    const room: Room = new Room();
    room.setName(name);
    room.setFileData(DEFAULT_FILE_NAME, DEFAULT_IMAGE_PATH);
    room.setThumbnail(DEFAULT_FILE_NAME, DEFAULT_IMAGE_PATH);
    return room;
  }

  narratorFromJson(narratorJson, introAudioFile, returnAudioFile): Narrator {
    const narrator = new Narrator();
    if (introAudioFile) {
      let fileName = decodeURIComponent(narratorJson.intro);
      if (narratorJson.intro.hasOwnProperty('file')) fileName = narratorJson.intro.file;
      const volume = narratorJson.volume;
      narrator.setIntroAudio(fileName, volume, introAudioFile);
    }
    if (returnAudioFile) {
      let fileName = decodeURIComponent(narratorJson.reprise);
      if (narratorJson.reprise.hasOwnProperty('file')) fileName = narratorJson.reprise.file;
      //const volume = narratorJson.volume;
      narrator.setReturnAudio(fileName, returnAudioFile);
    }
    return narrator;
  }

}

function deserializeLocationVector(locationVector: string): Vector2 {
  const vectorRegex = /[<〈]([\de\-\.]+),([\de\-\.]+)[〉>]/;
  const [locationString, matchX, matchY]: string[] = locationVector.match(vectorRegex);
  const x: number = parseFloat(matchX);
  const y: number = parseFloat(matchY);
  return new Vector2(x, y);
}
