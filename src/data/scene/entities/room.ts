import {Audio} from 'data/scene/entities/audio';
import {Image} from 'data/scene/entities/image';
import {Text} from 'data/scene/entities/text';
import {Door} from 'data/scene/entities/door';
import {Link} from 'data/scene/entities/link';
import {Vector2} from 'data/scene/entities/vector2';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {Narrator} from 'data/scene/entities/narrator';


import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {generateUniqueId} from 'data/util/uuid';
import {DEFAULT_FILE_NAME, DEFAULT_VOLUME} from 'ui/common/constants';
import {reverbList} from 'data/scene/values/reverbList';

export class Room implements RoomProperty {

  private id: string = generateUniqueId();
  private name: string = 'Default Room Name';
  private timestamp: number = Date.now();
  private location: Vector2 = new Vector2(180, 80);
  private reverb: string = reverbList[0];
  private backgroundImage: MediaFile = new MediaFile();
  private backgroundAudio: MediaFile = new MediaFile();
  private bgAudioVolume: number = DEFAULT_VOLUME;
  private thumbnail: MediaFile = new MediaFile();
  private audioSet: Set<Audio> = new Set<Audio>();
  private imageSet: Set<Image> = new Set<Image>();
  private textSet: Set<Text> = new Set<Text>();
  private doorSet: Set<Door> = new Set<Door>();
  private linkSet: Set<Link> = new Set<Link>();
  private narrator = new Narrator();
  private backgroundVideo: MediaFile = new MediaFile();
  private backgroundIsVideo = false;

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

  getAudio(): Set<Audio> {
    return this.audioSet;
  }

  addAudio(audio: Audio) {
    this.audioSet.add(audio);
  }

  removeAudio(audio: Audio) {
    this.audioSet.delete(audio);
  }

  getImages(): Set<Image> {
    return this.imageSet;
  }

  addImage(image: Image) {
    this.imageSet.add(image);
  }

  removeImage(image: Image) {
    this.imageSet.delete(image);
  }

  getText(): Set<Text> {
    return this.textSet;
  }

  addText(text: Text) {
    this.textSet.add(text);
  }

  removeText(text: Text) {
    this.textSet.delete(text);
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

  getLink(): Set<Link> {
    return this.linkSet;
  }

  addLink(link: Link) {
    this.linkSet.add(link);
  }

  removeLink(link: Link) {
    this.linkSet.delete(link);
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

  getBinaryFileData(): any {
    return this.backgroundImage.getBinaryFileData();
  }

  getBackgroundAudioBinaryFileData(): any {
    return this.backgroundAudio.getBinaryFileData();
  }

  // TODO: Rename to setBackgroundImage
  setFileData(fileName: string, binaryFileData: any) {
    this.backgroundImage.setFileName(fileName);
    this.backgroundImage.setBinaryFileData(binaryFileData);
  }

  getBackgroundImage(): MediaFile {
    return this.backgroundImage;
  }

  hasBackgroundImage(): boolean {
    return this.backgroundImage.getFileName() !== DEFAULT_FILE_NAME || this.backgroundIsVideo;
  }

  // TODO: setThumbnail calls should send a suffix _thumb
  setThumbnail(fileName: string, binaryFileData: any) {
    this.thumbnail.setFileName(fileName);
    this.thumbnail.setBinaryFileData(binaryFileData);
  }

  getThumbnail(): MediaFile {
    return this.thumbnail;
  }

  getThumbnailImage() {
    return this.thumbnail.getBinaryFileData();
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

  getNarrationIntroBinaryFileData(): any {
    return this.getNarrator().getIntroAudio().getBinaryFileData();
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

  setBackgroundAudio(fileName: string, volume: number, dataUrl: any) {
    this.backgroundAudio.setFileName(fileName);
    this.backgroundAudio.setBinaryFileData(dataUrl);
    this.setBackgroundAudioVolume(volume);
  }

  removeBackgroundAudio() {
    this.backgroundAudio = new MediaFile();
  }

  getBackgroundAudio(): MediaFile {
    return this.backgroundAudio;
  }

  setBackgroundAudioVolume(v: number) {
    this.bgAudioVolume = v;
  }

  getBackgroundAudioVolume(): number {
    return this.bgAudioVolume;
  }

  setBackgroundVideo(fileName: string, videoUrl: string) {
    this.backgroundVideo.setFileName(fileName);
    this.backgroundVideo.setBinaryFileData(videoUrl);
    this.backgroundIsVideo = true;
  }

  getBackgroundVideo(): string {
    return this.backgroundVideo.getBinaryFileData();
  }

  getBackgroundIsVideo(): boolean {
    return this.backgroundIsVideo;
  }

  //unused RoomProperty methods
  getPossibleCombinedHotspot(): boolean {return false;}
  setPossibleCombinedHotspot(isPossibleCombinedHotspot: boolean) {}

  toJson() {
    const roomJson = {
      uuid: this.id,
      name: this.name,
      time: this.timestamp,
      file: this.id, //refers to the name of the asset directory in zip file
      image: encodeURIComponent(this.backgroundImage.getFileName()),
      reverb: this.reverb,
      front: this.location.toString(),
      ambient: this.backgroundAudio.getFileName() ? encodeURIComponent(this.backgroundAudio.getFileName()) : '',
      bgVolume: this.bgAudioVolume,
      texts: Array.from(this.getText()).map(text => text.toJson()),
      clips: Array.from(this.getAudio()).map(audio => audio.toJson()),
      images: Array.from(this.getImages()).map(image => image.toJson()),
      doors: Array.from(this.getDoors()).filter(door => door.getAutoTime() <= 0).map(door => door.toJson()),
      autoDoors: Array.from(this.getDoors()).filter(door => door.getAutoTime() > 0).map(door => door.toJson()),
      narrator: this.narrator.toJson()
    };
    if (this.backgroundIsVideo) {
      (<any>roomJson).video = this.backgroundVideo.getBinaryFileData();
    }
    return roomJson;
  }

}
