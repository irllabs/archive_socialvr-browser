import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {ChatService} from 'data/chat/chatService';
import {UserService} from 'data/user/userService';

@Injectable()
export class ChatInteractor {

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) {}

  joinRoom(chatRoomId: string): Observable<any> {
    const userId = this.userService.getUserId();
    const userName = this.userService.getUserName();
    return this.chatService.joinRoom(chatRoomId, userId, userName);
  }

  leaveRoom(chatRoomId: string) {
    const userId = this.userService.getUserId();
    return this.chatService.leaveRoom(chatRoomId, userId);
  }

  observeRoom(roomAddress: string): Observable<any> {
    return this.chatService.observeRoom(roomAddress);
  }

  setLookAt(roomAddress: string, x: number, y: number, z: number): Observable<any> {
    const userId = this.userService.getUserId();
    return this.chatService.setLookAt(roomAddress, userId, x, y, z);
  }

}
