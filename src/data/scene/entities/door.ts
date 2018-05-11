import { BaseElement } from 'data/scene/entities/baseElement';
import { DEFAULT_DOOR_NAME } from 'ui/common/constants';

export class Door extends BaseElement {

  private roomId: string = '';
  private nameIsCustom: boolean = false;
  private autoTime: number = 0;

  constructor() {
    super();
  }

  setRoomId(roomId: string) {
    this.roomId = roomId;
  }

  getRoomId(): string {
    return this.roomId;
  }

  reset() {
    this.roomId = '';
    this.nameIsCustom = false;
    super.setName(DEFAULT_DOOR_NAME);
  }

  setCustomName(name: string) {
    super.setName(name);
    this.nameIsCustom = true;
  }

  setNameIsCustom(nameIsCustom) {
    this.nameIsCustom = nameIsCustom;
  }

  hasCustomName(): boolean {
    return this.nameIsCustom;
  }

  setAutoTime(autoTime: number) {
    this.autoTime = autoTime;
  }

  getAutoTime(): number {
    return this.autoTime;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: this.roomId,
      nameIsCustom: this.nameIsCustom,
      autoTime: this.autoTime,
    });
  }

}
