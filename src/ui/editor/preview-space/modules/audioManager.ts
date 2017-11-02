import {Injectable} from '@angular/core';

import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AssetInteractor, AssetModel} from 'core/asset/assetInteractor';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';

@Injectable()
export class AudioManager {

  private roomBgAudioMap: Map<String, Boolean> = new Map();
  private roomNarrationMap: Map<String, Boolean> = new Map();

  constructor(
    private metaDataInteractor: MetaDataInteractor,
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private audioPlayService: AudioPlayService
  ) {}

  loadBuffers(): Promise<any> {
    const soundtrackAudio = [];
    const soundtrack = this.metaDataInteractor.getSoundtrack();
    if (soundtrack.getBinaryFileData()) {
      const soundtrackPath = soundtrack.getBinaryFileData().changingThisBreaksApplicationSecurity ?
            soundtrack.getBinaryFileData().changingThisBreaksApplicationSecurity : soundtrack.getBinaryFileData();
      soundtrackAudio.push(new AssetModel('soundtrack', soundtrack.getFileName(), soundtrackPath));
    }

    const backgroundAudios = this.sceneInteractor.getRoomIds()
      .map(roomId => this.sceneInteractor.getRoomById(roomId))
      .filter(room => {
        if (room.getBackgroundAudioBinaryFileData()) {
          this.roomBgAudioMap.set(room.getId(), true);
          return true;
        } else {
          this.roomBgAudioMap.set(room.getId(), false);
          return false;
        }
      })
      .map(room => {
        let bAudioPath = room.getBackgroundAudioBinaryFileData();
        if (bAudioPath.changingThisBreaksApplicationSecurity) {
          bAudioPath = bAudioPath.changingThisBreaksApplicationSecurity;
        }
        return new AssetModel(room.getId()+'b', room.getBackgroundAudioFileName(), bAudioPath);

      });

      const narrationAudios = this.sceneInteractor.getRoomIds()
      .map(roomId => this.sceneInteractor.getRoomById(roomId))
      .filter(room => {
        if (room.getNarrationIntroBinaryFileData()) {
          this.roomNarrationMap.set(room.getId(), true);
          return true;
        } else {
          this.roomNarrationMap.set(room.getId(), false);
          return false;
        }
      })
      .map(room => {
        let nAudioPath = room.getNarrationIntroBinaryFileData();
        if (nAudioPath.changingThisBreaksApplicationSecurity) {
          nAudioPath = nAudioPath.changingThisBreaksApplicationSecurity;
        }
        return new AssetModel(room.getId()+'n', room.getNarrationIntroFileName(), nAudioPath);
      });

    const hotspotAudios = this.sceneInteractor.getRoomIds()
      .map(roomId => this.sceneInteractor.getRoomById(roomId))
      .reduce((accumulator, room) => {
        const audioPropertyList = Array.from(room.getAudio())
          .filter(audio => audio.getBinaryFileData())
          .map(audio => {
            const audioDataUri = audio.getBinaryFileData().changingThisBreaksApplicationSecurity ?
              audio.getBinaryFileData().changingThisBreaksApplicationSecurity : audio.getBinaryFileData();
            return new AssetModel(audio.getId(), audio.getFileName(), audioDataUri);
          });
        return accumulator.concat(audioPropertyList);
      }, []);

    const audioList = soundtrackAudio
      .concat(backgroundAudios)
      .concat(narrationAudios)
      .concat(hotspotAudios);

    return this.assetInteractor.loadAudioBuffers(audioList);
  }

  stopAllAudio() {
    this.audioPlayService.stopAll();
  }

  playSoundtrack() {
    const soundtrack = this.metaDataInteractor.getSoundtrack();
    if (soundtrack.getBinaryFileData()) {
      this.audioPlayService.playSoundtrack('soundtrack');
    }
  }

  playBackgroundAudio() {
    if (this.roomBgAudioMap.get(this.sceneInteractor.getActiveRoomId())) {
      const BackgroundAudioId: string = this.sceneInteractor.getActiveRoomId() + 'b';
      this.audioPlayService.playBgAudio(BackgroundAudioId);
    }
  }

  playNarration() {
    if (this.roomNarrationMap.get(this.sceneInteractor.getActiveRoomId())) {
      const NarrationId: string = this.sceneInteractor.getActiveRoomId() + 'n';
      this.audioPlayService.playHotspotAudio(NarrationId);
    }
  }

}
