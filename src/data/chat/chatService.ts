import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import {AuthenticationService} from 'data/authentication/authenticationService';


@Injectable()
export class ChatService {

  constructor(
    private authenticationService: AuthenticationService // remove
  ) {}

  joinRoom(chatRoomId: string, userId: string, userName: string): Observable<any> {
    const roomAddress = `/chatrooms/${chatRoomId}/`;
    const userAddress = `${roomAddress}${userId}`;
    const userData = { userName, userId, };
    const userReference = firebase.database().ref(userAddress);
    const updateDB = userReference.update(userData);
    userReference.onDisconnect().remove(() => {});
    return Observable.fromPromise(updateDB);
  }

  leaveRoom(chatRoomId: string, userId: string) {
    const roomAddress = `/chatrooms/${chatRoomId}/`;
    const userAddress = `${roomAddress}${userId}`;
    firebase.database().ref(userAddress).remove();
  }

  observeRoom(roomAddress: string): Observable<any> {
    return Observable.create(observer => {
      firebase.database().ref(roomAddress).on('value', snapshot => {
        observer.next(snapshot.val());
      });
    });
  }

  setLookAt(roomAddress: string, userId: string, x: number, y: number, z: number): Observable<any> {
    const userAddress = `/chatrooms/${roomAddress}/${userId}/lookingAt`;
    const lookingAt = {x, y, z};
    const updateDB = firebase.database().ref(userAddress).update(lookingAt);
    return Observable.fromPromise(updateDB);
  }

}
