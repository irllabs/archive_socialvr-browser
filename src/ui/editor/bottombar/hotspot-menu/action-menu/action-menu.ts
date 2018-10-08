import { Component, Input } from '@angular/core';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Door } from 'data/scene/entities/door';
import { Universal } from 'data/scene/entities/universal';
import { EventBus } from 'ui/common/event-bus';
import { SettingsService } from 'data/settings/settingsService';

@Component({
  selector: 'action-menu',
  styleUrls: ['./action-menu.scss'],
  templateUrl: './action-menu.html',
})
export class ActionMenu {

  @Input() isOpen: boolean = false;

  constructor(
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus,
    private settingsService: SettingsService
  ) {
  }
  public addUniversal() {
    const activeRoom = this.sceneInteractor.getActiveRoom()
    if(activeRoom.getUniversal().size >= this.settingsService.settings.maxHotspots){
      this.eventBus.onModalMessage('','You have reached maximum amount of hotspots per room')
      return
    }
    // const universalsLength = activeRoom.getUniversal().length
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    const universal: Universal = this.sceneInteractor.addUniversal(activeRoomId);
    this.eventBus.onSelectProperty(universal.getId(), true);
  }

  public addDoor() {
    const numberOfRooms = this.sceneInteractor.getRoomIds().length;

    if (numberOfRooms < 2) {
      this.eventBus.onModalMessage('', 'There must be at least two rooms to add a door.');
      return;
    }

    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    const door: Door = this.sceneInteractor.addDoor(activeRoomId);

    this.eventBus.onSelectProperty(door.getId(), true);

    // auto open door editor if there are multiple outgoing choices
    if (numberOfRooms > 2) {
      setTimeout(() => {
        this.eventBus.onSelectProperty(door.getId(), false, true);
      });
    }
  }
}
