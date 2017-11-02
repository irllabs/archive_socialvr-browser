import {Component, Input, SimpleChanges} from '@angular/core';

import {Door} from 'data/scene/entities/door';
import {Room} from 'data/scene/entities/room';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {DEFAULT_DOOR_NAME} from 'ui/common/constants';
import {EventBus} from 'ui/common/event-bus';

@Component({
  selector: 'door-editor',
  styleUrls: ['./door-editor.scss'],
  templateUrl: './door-editor.html'
})
export class DoorEditor {

  @Input() doorProperty: Door;

  private selectedRoom: any;
  private roomList: any[];
  private lastAutogoValue: number;

  // TODO: remove this value when slider is implemented
  private autoTimeViewModel: number = 0;

  constructor(
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus
  ) {}

  ngOnInit() {
    this.lastAutogoValue = this.doorProperty.getAutoTime() || 20;
    this.autoTimeViewModel = this.lastAutogoValue;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.roomList = this.createRoomList();
    if (!this.roomList.length) {
      return;
    }
    this.selectedRoom = this.roomList
      .find(room => room.id === this.doorProperty.getRoomId()) || this.roomList[0];
    this.onRoomChange(null);
  }

  private createRoomList(): any[] {
    const roomList = this.sceneInteractor.getRoomIds()
      .filter(roomId => roomId !== this.sceneInteractor.getActiveRoomId())
      .map(roomId => {
        const room: Room = this.sceneInteractor.getRoomById(roomId);
        return {id: room.getId(), name: room.getName(), disabled: false};
      });
    roomList.unshift({id: '', name: DEFAULT_DOOR_NAME, disabled: true});
    return roomList;
  }

  private onRoomChange(event) {
    if (!this.selectedRoom) return;

    this.doorProperty.setRoomId(this.selectedRoom.id);
    if (event) {
      this.setDefaultRoomName();
    }
  }

  private setDefaultRoomName() {
    const defaultRoomName: string = this.sceneInteractor
      .getRoomById(this.selectedRoom.id)
      .getName();

    setTimeout(() => {
      this.doorProperty.setName(defaultRoomName);
      this.doorProperty.setNameIsCustom(false);
    });
  }

  private showTransportButton(): boolean {
    return !!this.doorProperty.getRoomId();
  }

  private onTransportClick() {
    const outgoingRoomId = this.doorProperty.getRoomId();
    this.sceneInteractor.setActiveRoomId(outgoingRoomId);
    this.eventBus.onSelectRoom(outgoingRoomId, false);
  }

  private getDoorAutotime(): number {
    return this.doorProperty.getAutoTime();
  }

  private setDoorAutotime($event) {
    this.doorProperty.setAutoTime(parseInt($event.target.value));
  }

  private onCheckboxChange($event) {
    const autoTime = $event.value ? this.lastAutogoValue : 0;
    if (!$event.value) {
      this.lastAutogoValue = this.doorProperty.getAutoTime();
    }
    this.doorProperty.setAutoTime(autoTime);
  }

  private sliderIsVisible(): boolean {
    return this.doorProperty.getAutoTime() > 0;
  }

  private getAutoTimeViewModel() {
    return this.autoTimeViewModel;
  }

  private onSecondsChange($event) {
    this.autoTimeViewModel = parseFloat($event.text);
  }

  // TODO: remove when slider component is implemented
  private onSecondsBlur($event) {
    if (Number.isNaN(this.autoTimeViewModel)) {
      this.autoTimeViewModel = 0;
    }
    const value = Math.floor(this.autoTimeViewModel);
    const clampedValue = Math.max(1, Math.min(60, value));
    this.lastAutogoValue = this.doorProperty.getAutoTime();
    this.doorProperty.setAutoTime(clampedValue);
    this.autoTimeViewModel = clampedValue;
  }

}
