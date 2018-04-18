import BasePlane from "./base-plane";
import {AudioPlayService} from "../modules/audioPlayService";


export default class AudioPlane extends BasePlane {
  private audioPlayService: AudioPlayService;
  private audioBufferSourceNode: AudioBufferSourceNode;

  protected _hasPlaneMesh: boolean = false;

  public init(audioPlayService: AudioPlayService) {
    this.audioPlayService = audioPlayService;
  }

  public onActivated() {
    this.audioBufferSourceNode = this.audioPlayService.playHotspotAudio(this.prop.getId());
  }

  public onDeactivated() {
    if(this.audioBufferSourceNode) {
      this.audioPlayService.stopPlaying(this.audioBufferSourceNode);
    }
  }
}
