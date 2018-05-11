import { Component } from '@angular/core';

import { ChatInteractor } from 'core/chat/chatInteractor';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'chat',
  styleUrls: ['./chat.scss'],
  templateUrl: './chat.html',
})
export class Chat {

  private activeRoom: any = null;
  private userName: string = Math.round((Math.random() * 1000)) + '';
  private roomList = [];
  private subscriptions: Set<Subscription> = new Set<Subscription>();

  constructor(
    private chatInteractor: ChatInteractor,
  ) {
  }

  ngOnInit() {
    this.subscribeToEvents();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  subscribeToEvents() {
    const getRooms = this.chatInteractor.getRooms()
      .subscribe(
        chatRooms => {
          const roomListViewModel = Object.keys(chatRooms)
            .map(key => ({
              id: key,
              name: chatRooms[key].name,
            }));
          this.roomList = roomListViewModel;
        },
        error => console.log('onRoomChangeError', error),
      );
    this.subscriptions.add(getRooms);
  }

  createRoom() {
    const roomName = `RoomName_${Math.random()}`;
    this.chatInteractor.createRoom(roomName, this.userName, Math.random() + '')
      .subscribe(
        roomId => console.log(`roomCreated: ${roomId}`),
        error => console.log('create room error', error),
      );
  }

  userIsInRoom(): boolean {
    return !!this.activeRoom;
  }

}
