import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {RoomManager} from 'data/scene/roomManager';
import {PropertyBuilder} from 'data/scene/roomPropertyBuilder';
import {Room} from 'data/scene/entities/room';
import {Image} from 'data/scene/entities/image';
import {Audio} from 'data/scene/entities/audio';

import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';

import 'rxjs/add/observable/fromPromise';

import {
  STORY_FILE, UINT8ARRAY,
  MIME_TYPE_MP3, MIME_TYPE_PNG, MIME_TYPE_UTF8,
  MIME_TYPE_JPG, MIME_TYPE_JPEG, MIME_TYPE_WAV, MIME_TYPE_AAC, MIME_TYPE_XM4A,
  BACKGROUND_THUMBNAIL
} from 'ui/common/constants';

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class DeserializationService {

  private zip = new JSZip();

  constructor(
    private roomManager: RoomManager,
    private propertyBuilder: PropertyBuilder,
    private fileLoaderUtil: FileLoaderUtil
  ) {}

  private deserializeRooms(storyFile: any, binaryFileMap: any, baseFilePath: string): Promise<any> {
    return storyFile.async('string')
      .then(storyYamlString => {

        let storyJson;
        try {
          //remove room property descriptions from yaml file (ex: - !image, - !door)
          const bangDescriptionRegex = /!\w+\n/g;
          const newLineStoryYaml: string = storyYamlString.replace(/\r\n/g, '\n');
          const cleanedStoryYaml: string = newLineStoryYaml.replace(bangDescriptionRegex, '\n');
          storyJson = JsYaml.load(cleanedStoryYaml);
        }
        catch(error) {
          console.error(error);
          return;
        }
        this.roomManager.clearRooms();

        this.roomManager.setProjectName(storyJson.name);
        this.roomManager.setProjectTags(storyJson.tags || '');
        this.roomManager.setProjectDescription(storyJson.description);
        if (storyJson.homeRoomId) {
          this.roomManager.setHomeRoomId(storyJson.homeRoomId);
        }
        if (storyJson.soundtrack) {
          const soundtrack = binaryFileMap.find(mediaFile => mediaFile.name === storyJson.soundtrack);
          const soundtrackData = soundtrack ? soundtrack.fileData : null;
          this.roomManager.setSoundtrack(storyJson.soundtrack, storyJson.soundtrackVolume, soundtrackData);
        } else {
          this.roomManager.removeSoundtrack();
        }

        storyJson.rooms.map(roomData => {
          const filePrefix = roomData.uuid;
          //console.log('buildRoom', `${baseFilePath}${filePrefix}`);

          // Background image
          const roomImagePath = `${baseFilePath}${filePrefix}/${roomData.image}`;
          const roomImage = binaryFileMap.find(mediaFile => mediaFile.name === roomImagePath);
          const roomImageData = roomImage ? roomImage.fileData : null;

          // Background thumbnail
          const roomThumbPath = `${baseFilePath}${filePrefix}/${BACKGROUND_THUMBNAIL}`;
          const roomThumbnail = binaryFileMap.find(mediaFile => mediaFile.name === roomThumbPath);
          const thumbnailImageData = roomThumbnail ? roomThumbnail.fileData : null;

          // Background audio
          const backgroundAudioPath = `${baseFilePath}${filePrefix}/${roomData.ambient}`;
          const backgroundAudio = binaryFileMap.find(mediaFile => mediaFile.name === backgroundAudioPath);
          const backgroundAudioData = backgroundAudio ? backgroundAudio.fileData : null;

          // Narrator intro audio
          const introAudioPath = roomData.narrator ? `${baseFilePath}${filePrefix}/${roomData.narrator.intro}` : '';
          const introAudio = binaryFileMap.find(mediaFile => mediaFile.name === introAudioPath);
          const introAudioData = introAudio ? introAudio.fileData : null;

          // Narrator return audio
          const returnAudioPath = roomData.narrator ? `${baseFilePath}${filePrefix}/${roomData.narrator.reprise}` : '';
          const returnAudio = binaryFileMap.find(mediaFile => mediaFile.name === returnAudioPath);
          const returnAudioData = returnAudio ? returnAudio.fileData : null;

          const room: Room = this.propertyBuilder.roomFromJson(roomData, roomImageData, thumbnailImageData, backgroundAudioData);
          const doors = roomData.doors || [];
          const autoDoors = roomData.autoDoors || [];
          const allDoors = doors.concat(autoDoors);

          // necessary if yaml files use undefined vs empty array
          roomData.texts = roomData.texts || [];
          roomData.clips = roomData.clips || [];
          roomData.images = roomData.images || [];

          roomData.texts
            .map(textJson => this.propertyBuilder.textFromJson(textJson))
            .forEach(text => room.addText(text));

          roomData.clips
            .map(audioJson => {
              const fileName: string = `${baseFilePath}${filePrefix}/${audioJson.file}`;
              const binaryFile = binaryFileMap
                .find(mediaFile => mediaFile.name === fileName);
              const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
              return this.propertyBuilder.audioFromJson(audioJson, binaryFileData);
            })
            .forEach(audio => room.addAudio(audio));

          roomData.images
            .map(imageJson => {
              const fileName: string = `${baseFilePath}${filePrefix}/${imageJson.file}`;
              console.log('deserializer: ',binaryFileMap);
              const binaryFile = binaryFileMap
                .find(mediaFile => mediaFile.name === fileName);
              const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
              return this.propertyBuilder.imageFromJson(imageJson, binaryFileData);
            })
            .forEach(image => room.addImage(image));

          allDoors
            .map(doorJson => this.propertyBuilder.doorFromJson(doorJson))
            .forEach(door => room.addDoor(door));

          const narrator = this.propertyBuilder.narratorFromJson(roomData.narrator, introAudioData, returnAudioData);
          room.setNarrator(narrator);

          this.roomManager.addRoom(room);
      });
    });
  }

  unzipStoryFile(file: any): Observable<any> {
    return Observable.fromPromise(
      this.zip.loadAsync(file).then(deserializeProject.bind(this))
    );
  }

}

// Given a jszip file containing an image or audio
// return a promise containing the name of the file
// and binary data
function loadMediaFile(mediaFile: any, getBinaryFileData: any): Promise<any> {
  //console.log('loading media file', mediaFile)
  return mediaFile.async(UINT8ARRAY)
    .then(fileData => {
      //console.log('---fileData', mediaFile);
      const fileType = getFileType(mediaFile.name);
      return new Blob([fileData], {type: fileType});
    })
    .then(blob => {
      //console.log('---blob', mediaFile);
      return getBinaryFileData(blob);
    })
    .then(binaryDataFile => {
      //console.log('success', mediaFile.name)
      return {
        name: mediaFile.name,
        fileData: binaryDataFile
      };
    })
    .catch(error => console.log('error', mediaFile.name, error));
}

async function loadMediaFileWrapper(mediaFile: any, getBinaryFileData: any): Promise<any> {
  //console.log('loadMediaFileWrapper', mediaFile);
  return await loadMediaFile(mediaFile, getBinaryFileData);
}

// Given a json object of jszip files, return a list of
// promises containing image and audio binary data
async function loadMediaFiles(fileMap: any, storyFilePath: string, getBinaryFileData: any) {
  //console.log('load media files', fileMap);
  const files = Object.keys(fileMap)
    .filter(fileKey => fileKey !== storyFilePath)
    .map(fileKey => fileMap[fileKey])
    .filter(file => !file.dir);
  //console.log('files to load', files);

  console.log('files:', files);
  const mediaFiles = [];

  // async function printFiles () {
  // const files = await getFilePaths();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await loadMediaFile(file, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
    // const contents = await fs.readFile(file, 'utf8');
    // console.log(contents);
  }
  return mediaFiles;

  // files.forEach(f => {
  //   loadMediaFileWrapper(f, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
  // });
  //
  // return files.map(f => {
  //   return loadMediaFileWrapper(f, getBinaryFileData)
  // });

  // for (const f of meteredPromises) {
  //   await Promise.all(subList)
  //     .then(resultList => {
  //       console.log('adding to resultList:', resultList)
  //       results = [...results, ...resultList];
  //     });
  // }

    // .map(file => loadMediaFile(file, getBinaryFileData));
}

async function meterPromises(rate, promiseList): Promise<any> {
  const meteredPromises = promiseList
    .reduce((aggretate, mediaFilePromise, index) => {
      if (index % rate === 0) {
        const newList = [mediaFilePromise];
        aggretate.push(newList);
      }
      else {
        const lastElement = aggretate[aggretate.length - 1];
        lastElement.push(mediaFilePromise);
      }
      return aggretate;
    }, []);

  let results = [];

  for (const subList of meteredPromises) {
    await Promise.all(subList)
      .then(resultList => {
        //console.log('adding to resultList:', resultList)
        results = [...results, ...resultList];
      });
  }
  return results;
}

// function meterList(rate, promiseList) {
//   return new Promise((resolve, reject) => {
//     // meter media file loading
//     // const rate = 1;
//     const meteredPromises = promiseList
//       .reduce((aggretate, mediaFilePromise, index) => {
//         if (index % rate === 0) {
//           const newList = [mediaFilePromise];
//           aggretate.push(newList);
//         }
//         else {
//           const lastElement = aggretate[aggretate.length - 1];
//           lastElement.push(mediaFilePromise);
//         }
//         return aggretate;
//       }, []);
//
//     meteredPromises.map(subList => Promise.all(subList))
//   });
// }

// Given a JSON object representing story file,
// return a promise that resolves when the story file is deserialized
function deserializeProject(jsZipData) {
  console.log('jsZipData', jsZipData);
  const fileMap = jsZipData.files;
  console.log('fileMap', fileMap);
  const storyFilePath: string = Object.keys(fileMap)
    .filter(fileKey => fileKey.indexOf(STORY_FILE) > -1)[0] || STORY_FILE;
  const baseFilePath: string = storyFilePath.substring(0, storyFilePath.indexOf(STORY_FILE));

  const storyFile = fileMap[storyFilePath];
  //console.log('storyFile', storyFile)
  const getBinaryFileData = this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil);
  const mediaFilePromises = loadMediaFiles(fileMap, storyFilePath, getBinaryFileData);

  return mediaFilePromises.then(bianryFileMap => this.deserializeRooms(storyFile, bianryFileMap, baseFilePath));
  // return Promise.all(mediaFilePromises)
  //     .then(bianryFileMap => this.deserializeRooms(storyFile, bianryFileMap, baseFilePath));

  // return meterPromises(2, mediaFilePromises)
  //   .then(bianryFileMap => this.deserializeRooms(storyFile, bianryFileMap, baseFilePath));
}

function getFileType(fileName) {
  const fileType = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
  const fileMap = {
    '.mp3': MIME_TYPE_MP3,
    '.wav': MIME_TYPE_WAV,
    '.aac': MIME_TYPE_AAC,
    '.m4a': MIME_TYPE_XM4A,
    '.png': MIME_TYPE_PNG,
    '.jpg': MIME_TYPE_JPG,
    '.jpeg': MIME_TYPE_JPEG
  };
  return fileMap[fileType] || MIME_TYPE_PNG;
}
