import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import {AuthService} from 'data/authentication/authService';


@Injectable()
export class ChatService {

  constructor(
    private authService: AuthService // remove
  ) {
  }

  // TODO: remove
  createRoom(roomName: string, userName: string, userId: string): Observable<any> {
    const room = {
      name: roomName,
      creatorId: userId,
      users: {
        id: {
          name: userName
        }
      },
      project: {
        userId: '', // TODO
        projectId: '', // TODO
      }
    };
    const chatRoomKey = firebase.database().ref().child('/chatrooms/').push().key;
    const updateDB = firebase.database().ref(`/chatrooms/${chatRoomKey}`).update(room)
    return Observable.fromPromise(updateDB);
  }

  // TODO: remove
  getRooms(): Observable<any> {
    const observable = Observable.create(observer => {
      firebase.database().ref('/chatrooms/')
        .on('value', snapshot => {
          observer.next(snapshot.val());
        });
    });
    return observable;
  }

  // return a promise with the room address
  joinRoom(chatRoomId: string, userId: string, userName: string): Observable<any> {
    const roomAddress = `/chatrooms/${chatRoomId}/`;
    const userAddress = `${roomAddress}${userId}`;
    const userData = {
      name: userName
    };
    const updateDB = firebase.database().ref(userAddress).update(userData);
    return Observable.fromPromise(updateDB);
  }

  observeRoom(roomAddress: string): Observable<any> {
    console.log('roomAddress', roomAddress);
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
