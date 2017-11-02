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

  createRoom(roomName: string, userName: string, userId: string): Observable<any> {
    return this.chatService.createRoom(roomName, userName, userId);
  }

  getRooms(): Observable<any> {
    return this.chatService.getRooms();
  }

  joinRoom(chatRoomId: string): Observable<any> {
    const userId = this.userService.getUserId();
    const userName = this.userService.getUserName();
    return this.chatService.joinRoom(chatRoomId, userId, userName);
  }

  observeRoom(roomAddress: string): Observable<any> {
    return this.chatService.observeRoom(roomAddress);
  }

  setLookAt(roomAddress: string, x: number, y: number, z: number): Observable<any> {
    const userId = this.userService.getUserId();
    return this.chatService.setLookAt(roomAddress, userId, x, y, z);
  }

}
