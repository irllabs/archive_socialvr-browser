import {
  BACKGROUND_THUMBNAIL,
  DEFAULT_FILE_NAME,
  DEFAULT_IMAGE_PATH,
  DEFAULT_VOLUME,
  STORY_FILE_YAML,
  UINT8ARRAY,
} from '../../../ui/common/constants';
import { Narrator } from '../../scene/entities/narrator';
import { Room } from '../../scene/entities/room';
import { Universal } from '../../scene/entities/universal';
import { Vector2 } from '../../scene/entities/vector2';
import { RoomProperty } from '../../scene/interfaces/roomProperty';
import { reverbList } from '../../scene/values/reverbList';
import { resizeImage } from '../../util/imageResizeService';
import { deserializeLocationVector } from '../../util/vector';

export default function deserializeOldStory(ds, storyJson, fileMap) {
  const jsonStoryFilePath: string = Object.keys(fileMap).find(path => path.endsWith('.json'));
  const yamlStoryFilePath: string = Object.keys(fileMap).find(path => path.endsWith('.yml')) || STORY_FILE_YAML;
  const storyFilePath = jsonStoryFilePath || yamlStoryFilePath;

  let baseFilePath: string = `${storyFilePath.split('/').slice(0, -1).join('/')}/`;

  if (baseFilePath[0] === '/') {
    baseFilePath = baseFilePath.slice(1);
  }

  const getBinaryFileData = ds.fileLoaderUtil.getBinaryFileData.bind(ds.fileLoaderUtil);
  return loadMediaFiles(ds, fileMap, storyJson, getBinaryFileData)
    .then((binaryFileMap) => {
      return deserializeRooms(
        ds,
        storyJson,
        binaryFileMap.filter(f => !!f), // get rid of undefined
        baseFilePath,
      );
    });
}

async function loadMediaFiles(ds, fileMap, storyJson, getBinaryFileData) {
  const mediaFiles = [];
  const files = Object.keys(fileMap)
    .filter(fileKey => !fileKey.endsWith('.yml'))
    .filter(fileKey => !fileKey.endsWith('.json'))
    .map(fileKey => fileMap[fileKey])
    .filter(file => !file.dir);

  const remoteFiles = [];

  if (!storyJson) {
    return remoteFiles;
  }

  storyJson.rooms.forEach((room) => {
    const universalMediaFiles = (room.universal || []).reduce((acc, universal) => {
      return acc.concat([
        {
          file: universal.imageFile,
          remoteFile: universal.remoteImageFile,
        },
        {
          file: universal.audioFile,
          remoteFile: universal.remoteAudioFile,
        },
      ]);
    }, []);
    const assets = [
      ...room.clips,
      ...room.images,
      ...universalMediaFiles,
      room.ambient,
      room.image,
      room.thumbnail || {}, // new key that is not present in older story files
      (room.narrator || {}).intro,
      (room.narrator || {}).reprise,
    ].filter(a => !!a);

    assets.forEach((asset) => {
      if (asset.hasOwnProperty('remoteFile') && asset.remoteFile) {
        // Add to remoteFiles if not present locally
        asset.filePath = `${room.uuid}/${asset.file}`;

        if (!files.find(file => file.name.indexOf(asset.filePath) !== -1)) {
          remoteFiles.push(asset);
        }
      }
    });
  });

  for (let i = 0; i < remoteFiles.length; i++) {
    const file = remoteFiles[i];

    await loadRemoteMediaFile(ds, file, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    await loadMediaFile(ds, file, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
  }

  return mediaFiles;
}

function loadRemoteMediaFile(ds, mediaFile: any, getBinaryFileData: any) {
  let remoteFileUrl = mediaFile.remoteFile;

  if (mediaFile.remoteFile.indexOf('socialvr-staging.s3.amazonaws.com') > 0) {
    remoteFileUrl = `${mediaFile.remoteFile.replace('socialvr-staging.s3.amazonaws.com', 'socialvr-staging.imgix.net')}?q=60`;
  }

  return ds.apiService.downloadMedia(remoteFileUrl).toPromise()
    .then((fileData) => {
      const fileType = ds.getFileMimeType(mediaFile.file);

      return new Blob([fileData], { type: fileType });
    })
    .then((blob) => {
      return blob.size <= 9 ? null : getBinaryFileData(blob);
    })
    .then((binaryDataFile) => {
      let name = mediaFile.filePath;

      if (name[0] === '/') {
        name = name.slice(1);
      }

      return {
        name,
        fileData: binaryDataFile,
        remoteFile: remoteFileUrl,
      };
    })
    .catch((error) => {
      console.log('error', mediaFile.file, error);
    });
}

function loadMediaFile(ds, mediaFile: any, getBinaryFileData: any) {
  return mediaFile.async(UINT8ARRAY)
    .then(fileData => {
      const fileType = ds.getFileMimeType(mediaFile.name);

      return new Blob([fileData], { type: fileType });
    })
    .then(blob => {
      return getBinaryFileData(blob);
    })
    .then(binaryDataFile => {
      return {
        name: mediaFile.name,
        fileData: binaryDataFile,
      };
    });
}

function deserializeRooms(ds, storyJson, binaryFileMap, baseFilePath) {
  if (!storyJson) {
    return;
  }

  ds.roomManager.clearRooms();
  ds.roomManager.setProjectName(storyJson.name);
  ds.roomManager.setProjectTags(storyJson.tags || '');
  ds.roomManager.setProjectDescription(storyJson.description);

  if (storyJson.homeRoomId) {
    ds.roomManager.setHomeRoomId(storyJson.homeRoomId);
  }

  if (storyJson.soundtrack) {
    const soundtrackFileName = decodeURIComponent(storyJson.soundtrack.file);
    const soundtrack = binaryFileMap.find(mediaFile => mediaFile.name === soundtrackFileName);
    const soundtrackData = soundtrack ? soundtrack.fileData : null;

    ds.roomManager.setSoundtrack(soundtrackFileName, storyJson.soundtrackVolume, soundtrackData);
  } else {
    ds.roomManager.removeSoundtrack();
  }

  storyJson.rooms.map((roomData) => {
    const filePrefix = roomData.uuid;

    // Normalize room data
    roomData.ambient = roomData.ambient ? roomData.ambient : {};
    roomData.narrator = roomData.narrator ? roomData.narrator : { intro: {}, reprise: {} };

    // Background image
    let filename = roomData.image;

    if (roomData.image.hasOwnProperty('file')) {
      filename = roomData.image.file;
    }

    const roomImage = getFile(binaryFileMap, `${filePrefix}/${filename}`, baseFilePath);
    const roomImageData = roomImage ? roomImage.fileData : null;

    // Background thumbnail
    const roomThumbnail = getFile(binaryFileMap, `${filePrefix}/${BACKGROUND_THUMBNAIL}`, baseFilePath);
    const thumbnailImageData = roomThumbnail ? roomThumbnail.fileData : null;

    filename = roomData.ambient.hasOwnProperty('file') ? roomData.ambient.file : roomData.ambient;

    // Background audio
    const backgroundAudio = filename && getFile(binaryFileMap, `${filePrefix}/${filename}`, baseFilePath);
    const backgroundAudioData = backgroundAudio ? backgroundAudio.fileData : null;

    filename = roomData.narrator.intro.hasOwnProperty('file') ? roomData.narrator.intro.file : roomData.narrator.intro;

    // Narrator intro audio
    const introAudio = roomData.narrator ? getFile(binaryFileMap, `${filePrefix}/${filename}`, baseFilePath) : '';
    const introAudioData = introAudio ? introAudio.fileData : null;

    filename = roomData.narrator.reprise.hasOwnProperty('file') ? roomData.narrator.reprise.file : roomData.narrator.reprise;

    // Narrator return audio
    const returnAudio = roomData.narrator ? getFile(binaryFileMap, `${filePrefix}/${filename}`, baseFilePath) : '';
    const returnAudioData = returnAudio ? returnAudio.fileData : null;

    const room: Room = roomFromJson(roomData, roomImageData, thumbnailImageData, backgroundAudioData);
    const doors = roomData.doors || [];
    const autoDoors = roomData.autoDoors || [];
    const allDoors = doors.concat(autoDoors);

    // necessary if yaml files use undefined vs empty array
    roomData.texts = roomData.texts || [];
    roomData.clips = roomData.clips || [];
    roomData.images = roomData.images || [];

    // Convert old project's hotspots to new Universal one
    convertToUniversal(
      room,
      baseFilePath,
      filePrefix,
      binaryFileMap,
      roomData.texts,
      roomData.clips,
      roomData.images,
    );

    (roomData.universal || [])
      .map(universalJson => {
        const imageFileName: string = `${filePrefix}/${universalJson.imageFile}`;
        const imageBinaryFile = getFile(binaryFileMap, imageFileName, baseFilePath);

        const imageBinaryFileData: string = imageBinaryFile ? imageBinaryFile.fileData : null;

        const audioFileName: string = `${filePrefix}/${universalJson.audioFile}`;
        const audioBinaryFile = getFile(binaryFileMap, audioFileName, baseFilePath);
        const audioBinaryFileData: string = audioBinaryFile ? audioBinaryFile.fileData : null;

        return universalFromJson(universalJson, imageBinaryFileData, audioBinaryFileData);
      })
      .forEach(universal => room.addUniversal(universal));

    allDoors
      .map(doorJson => ds.propertyBuilder.doorFromJson(doorJson))
      .forEach(door => room.addDoor(door));

    const narrator = narratorFromJson(roomData.narrator, introAudioData, returnAudioData);

    room.setNarrator(narrator);

    ds.roomManager.addRoom(room);
  });
}

function getFile(fileMap, fileName, baseFilePath) {
  return fileMap.find((mediaFile) => {
    return (mediaFile.name || '').replace(baseFilePath, '') === fileName.replace(baseFilePath, '');
  });
}

function convertToUniversal(room, baseFilePath, filePrefix, binaryFileMap, texts, clips, images) {
  const universals = [];

  // Text to Universal
  texts.forEach((textJson) => {
    const universal: Universal = <Universal> setBaseProperties(textJson, new Universal());

    universal.textContent = textJson.file;
    universal.setAudioContent(DEFAULT_FILE_NAME, null, DEFAULT_VOLUME);
    universal.setImageContent(DEFAULT_FILE_NAME, null);

    universals.push(universal);
  });

  // Audio to Universal
  clips.forEach((audioJson) => {
    const universal: Universal = <Universal> setBaseProperties(audioJson, new Universal());
    const fileName: string = `${baseFilePath}${filePrefix}/${audioJson.file}`;
    const binaryFile = binaryFileMap.find(mediaFile => mediaFile.name === fileName);
    const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
    const volume = audioJson.volume;
    let audioFileName = DEFAULT_FILE_NAME;

    if (audioJson.hasOwnProperty('file')) audioFileName = decodeURIComponent(audioJson.file);

    universal.setAudioContent(audioFileName, binaryFileData, volume);
    universal.setImageContent(DEFAULT_FILE_NAME, null);

    universals.push(universal);
  });

  // Image to Universal
  images.forEach((imageJson) => {
    const universal: Universal = <Universal> setBaseProperties(imageJson, new Universal());
    const fileName: string = `${baseFilePath}${filePrefix}/${imageJson.file}`;
    const binaryFile = binaryFileMap.find(mediaFile => mediaFile.name === fileName);
    const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
    let imageFileName = DEFAULT_FILE_NAME;

    if (imageJson.hasOwnProperty('file')) imageFileName = decodeURIComponent(imageJson.file);

    universal.setImageContent(imageFileName, binaryFileData);
    universal.setAudioContent(DEFAULT_FILE_NAME, null);

    universals.push(universal);
  });

  universals.forEach(universal => room.addUniversal(universal));
}

function setBaseProperties(jsonData: any, roomProperty: RoomProperty) {
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

function universalFromJson(universalJson: any, imageBinaryFileData: string, audioBinaryFileData: string) {
  const universal: Universal = <Universal> setBaseProperties(universalJson, new Universal());

  // text
  universal.textContent = universalJson.text;

  // image
  let imageFileName = DEFAULT_FILE_NAME;

  if (universalJson.hasOwnProperty('imageFile')) imageFileName = decodeURIComponent(universalJson.imageFile);

  universal.setImageContent(imageFileName, imageBinaryFileData);

  // audio
  let audioFileName = DEFAULT_FILE_NAME;

  if (universalJson.hasOwnProperty('audioFile')) audioFileName = decodeURIComponent(universalJson.audioFile);

  universal.setAudioContent(audioFileName, audioBinaryFileData);
  universal.loop = universalJson.loop;
  universal.volume = universalJson.volume;

  return universal;
}

function narratorFromJson(narratorJson, introAudioFile, returnAudioFile): Narrator {
  const narrator = new Narrator();

  if (introAudioFile) {
    let fileName = decodeURIComponent(narratorJson.intro);
    let remoteFileName = '';
    if (narratorJson.intro.hasOwnProperty('file')) fileName = narratorJson.intro.file;

    const volume = narratorJson.volume;

    narrator.setIntroAudio(fileName, volume, introAudioFile, remoteFileName);
  }

  if (returnAudioFile) {
    let fileName = decodeURIComponent(narratorJson.reprise);
    let remoteFileName = '';

    if (narratorJson.reprise.hasOwnProperty('file')) fileName = narratorJson.reprise.file;

    //const volume = narratorJson.volume;
    narrator.setReturnAudio(fileName, returnAudioFile, remoteFileName);
  }
  return narrator;
}

function roomFromJson(roomJson: any, binaryFileData: string, thumbnail: string, backgroundAudioUrl): Room {
  const room: Room = <Room> setBaseProperties(roomJson, new Room());
  const imageData = binaryFileData || DEFAULT_IMAGE_PATH;

  room.setBackgroundImageBinaryData(imageData);

  if (thumbnail) {
    room.setThumbnail(thumbnail);
  } else if (!thumbnail && binaryFileData) {
    resizeImage(binaryFileData, 'projectThumbnail')
      .then(resizedImageData => {
        room.setThumbnail(resizedImageData);
      })
      .catch(error => console.log('generate thumbnail error', error));
  }

  if (backgroundAudioUrl) {
    room.setBackgroundAudio(roomJson.bgVolume, backgroundAudioUrl);
  }

  if (roomJson.front) {
    const location: Vector2 = deserializeLocationVector(roomJson.front);

    room.setLocation(location);
  }
  if (roomJson.video && roomJson.video.length > 0) {
    room.setBackgroundVideo(roomJson.video);
  }

  room.setReverb(roomJson.reverb || reverbList[0]);

  return room;
}
