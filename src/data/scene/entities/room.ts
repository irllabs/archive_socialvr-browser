import { Audio } from 'data/scene/entities/audio';
import { Door } from 'data/scene/entities/door';
import { Image } from 'data/scene/entities/image';
import { MediaFile } from 'data/scene/entities/mediaFile';
import { Narrator } from 'data/scene/entities/narrator';
import { Universal } from 'data/scene/entities/universal';
import { Vector2 } from 'data/scene/entities/vector2';

import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { reverbList } from 'data/scene/values/reverbList';
import { generateUniqueId } from 'data/util/uuid';
import { DEFAULT_FILE_NAME, DEFAULT_VOLUME } from 'ui/common/constants';

export class Room implements RoomProperty {

  private id: string = generateUniqueId();
  private name: string = 'Default Room Name';
  private timestamp: number = Date.now();
  private location: Vector2 = new Vector2(180, 80);
  private reverb: string = reverbList[0];
  private backgroundImage: Image = new Image();
  private backgroundAudio: Audio = new Audio();
  private bgAudioVolume: number = DEFAULT_VOLUME;
  private thumbnail: Image = new Image();
  private universalSet: Set<Universal> = new Set<Universal>();
  private doorSet: Set<Door> = new Set<Door>();
  private narrator = new Narrator();
  private backgroundVideo: MediaFile = new MediaFile();
  private backgroundIsVideo = false;
  private _isLoadedAssets: boolean = true;
  private _loadingPercents: string = '0';

  public get isLoadedAssets(): boolean {
    return this._isLoadedAssets;
  }

  public get loadingPercents(): string {
    return this._loadingPercents;
  }

  public setAssetsLoadedState(isLoaded: boolean) {
    this._isLoadedAssets = isLoaded;
  }

  public setProgressLoading(percents: number): void {
    this._loadingPercents = percents.toFixed(0);
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): RoomProperty {
    this.id = id;
    return this;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): RoomProperty {
    this.name = name;
    return this;
  }

  getUniversal(): Set<Universal> {
    return this.universalSet;
  }

  addUniversal(universal: Universal) {      
    let Xpos :number;
    let Ypos :number;
    let Accumulator:number=-1;
    let validator=true;
  
    while(validator){
      Xpos=Math.random() *(350-30)+30;
      Ypos=Math.random() *(72);
      Ypos*=Math.floor(Math.random()*2) == 1 ? 1 : -1;
      Accumulator=0;
      //console.log("main loop");
      this.universalSet.forEach(function(value){
        //console.log("second loop");
          if( (Xpos>=value.location.getX()+38 || Xpos<=value.location.getX()-38)
               ||  
               (Ypos>=value.location.getY()+38 || Ypos<=value.location.getY()-38))
          {
            Accumulator+=1;
          }else{
          // console.log("overlap");
          }
        })
        //console.log("second loop finished");
        if(this.universalSet.size==Accumulator)
        {
          validator=false
        }else{
          //console.log("run the main loop again")
        }
      }
      let newlocation: Vector2  = new Vector2(Xpos, Ypos)
      universal.setLocation(newlocation);
      //console.log(this.universalSet.size);
      //console.log(this.universalSet);
      this.universalSet.add(universal);
  }

  removeUniversal(universal: Universal) {
    this.universalSet.delete(universal);
  }

  addDoor(door: Door) {
    this.doorSet.add(door);
  }

  removeDoor(door: Door) {
    this.doorSet.delete(door);
  }

  getDoors() {
    return this.doorSet;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  setTimestamp(timestamp: number): RoomProperty {
    this.timestamp = timestamp;
    return this;
  }

  getFileName(): string {
    return this.backgroundImage.getFileName();
  }

  getBackgroundAudioFileName(): string {
    return this.backgroundAudio.getFileName();
  }

  getNarrationIntroFileName(): string {
    return this.getNarrator().getIntroAudio().getFileName();
  }

  getBackgroundImageBinaryData(unsafe: boolean = false): any {
    return this.backgroundImage.getBinaryFileData(unsafe);
  }

  getBackgroundAudioBinaryFileData(unsafe: boolean = false): any {
    return this.backgroundAudio.getBinaryFileData(unsafe);
  }

  setBackgroundImageBinaryData(binaryFileData: any) {
    this.backgroundImage.setBinaryFileData(binaryFileData);
  }

  getBackgroundImage(): Image {
    return this.backgroundImage;
  }

  hasBackgroundImage(): boolean {
    return this.backgroundImage.getFileName() !== DEFAULT_FILE_NAME || this.backgroundIsVideo;
  }

  setThumbnail(binaryFileData: any) {
    this.thumbnail.setBinaryFileData(binaryFileData);
  }

  getThumbnail(): Image {
    return this.thumbnail;
  }

  getThumbnailImage(unsafe: boolean = false) {
    return this.thumbnail.getBinaryFileData(unsafe);
  }

  getThumbnailName(): string {
    return this.thumbnail.getFileName();
  }

  getNarrator(): Narrator {
    return this.narrator;
  }

  setNarrator(narrator: Narrator) {
    this.narrator = narrator;
  }

  getNarrationIntroBinaryFileData(unsafe: boolean = false): any {
    return this.getNarrator().getIntroAudio().getBinaryFileData(unsafe);
  }

  getLocation(): Vector2 {
    return this.location;
  }

  setLocation(location: Vector2): RoomProperty {
    this.location = location;
    return this;
  }

  getReverb(): string {
    return this.reverb;
  }

  setReverb(reverb: string) {
    this.reverb = reverb;
  }

  setBackgroundAudio(volume: number, dataUrl: any) {
    this.backgroundAudio.setBinaryFileData(dataUrl);
    this.setBackgroundAudioVolume(volume);
  }

  removeBackgroundAudio() {
    this.backgroundAudio = new Audio();
  }

  getBackgroundAudio(): Audio {
    return this.backgroundAudio;
  }

  setBackgroundAudioVolume(v: number) {
    this.bgAudioVolume = v;
  }

  getBackgroundAudioVolume(): number {
    return this.bgAudioVolume;
  }

  setBackgroundVideo(videoUrl: string) {
    this.backgroundVideo.setBinaryFileData(videoUrl);
    this.backgroundIsVideo = true;
  }

  getBackgroundVideoMediaFile(): MediaFile {
    return this.backgroundVideo;
  }

  getBackgroundVideo(): string {
    return this.backgroundVideo.getBinaryFileData();
  }

  getBackgroundIsVideo(): boolean {
    return this.backgroundIsVideo;
  }

  getIcon() {
    return null;
  }

  //unused RoomProperty methods
  getPossibleCombinedHotspot(): boolean {
    return false;
  }

  setPossibleCombinedHotspot(isPossibleCombinedHotspot: boolean) {
  }

  toJson() {
    const image = this.backgroundImage.toJson();
    const thumbnail = this.thumbnail.toJson();
    const ambient = this.backgroundAudio.toJson();
    const {
      id: uuid,
      id: file,
      timestamp: time,
      name,
    } = this;
    const roomJson = {
      uuid,
      name,
      time,
      file,
      image,
      thumbnail,
      ambient,
      reverb: this.reverb,
      front: this.location.toString(),
      bgVolume: this.bgAudioVolume,
      universal: Array.from(this.getUniversal()).map(universal => universal.toJson()),
      doors: Array.from(this.getDoors()).filter(door => door.getAutoTime() <= 0).map(door => door.toJson()),
      autoDoors: Array.from(this.getDoors()).filter(door => door.getAutoTime() > 0).map(door => door.toJson()),
      narrator: this.narrator.toJson(),
    };
    if (this.backgroundIsVideo) {
      (<any>roomJson).video = this.backgroundVideo.getBinaryFileData();
    }

    return roomJson;
  }
}
