import {Injectable, HostListener} from '@angular/core';

import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

@Injectable()
export class EventBus {

  private static subject: Subject<Event> = new Subject<Event>();

  private static staticConstructor = (() => {
    window.addEventListener('mousedown', $event => {
      const event: Event = new Event(EventType.MOUSE_DOWN, $event);
      EventBus.subject.next(event);
    });
    window.addEventListener('mousemove', $event => {
      const event: Event = new Event(EventType.MOUSE_MOVE, $event);
      EventBus.subject.next(event);
    });
    window.addEventListener('mouseup', $event => {
      const event: Event = new Event(EventType.MOUSE_UP, $event);
      EventBus.subject.next(event);
    });
    window.addEventListener('click', $event => {
      const event: Event = new Event(EventType.CLICK, $event);
      EventBus.subject.next(event);
    });
    window.addEventListener('resize', $event => {
      const eventPayload = {x: window.innerWidth, y: window.innerHeight};
      const event: Event = new Event(EventType.WINDOW_RESIZE, eventPayload);
      EventBus.subject.next(event);
    });
    window.addEventListener('vrdisplaypresentchange', $event => {
      const event: Event = new Event(EventType.VR_DISPLAY_CHANGE, $event);
      EventBus.subject.next(event);
    });
  })();

  getObservable(eventType: EventType): Observable<any> {
    return EventBus.subject
      .filter(evt => evt.eventType === eventType)
      .map(evt => evt.value);
  }

  onSelectProperty(propertyId: string, isNewProperty: boolean, shouldOpenEditor?: boolean) {
    const eventPayload = {propertyId: propertyId, isNewProperty: isNewProperty, shouldOpenEditor: shouldOpenEditor};
    const event: Event = new Event(EventType.SELECT_PROPERTY, eventPayload);
    EventBus.subject.next(event);
  }

  onSelectRoom(roomId: string, isNewProperty: boolean) {
    const eventPayload = {roomId: roomId, isNewProperty: isNewProperty};
    const event: Event = new Event(EventType.SELECT_ROOM, eventPayload);
    EventBus.subject.next(event);
  }

  onModalMessage(header: string, body: string, isMessage?: boolean, onDismiss?: Function, onAccept?: Function) {
    const eventPayload = {header, body, isMessage, onDismiss, onAccept};
    const event: Event = new Event(EventType.MODAL_MESSAGE, eventPayload);
    EventBus.subject.next(event);
  }

  onStartLoading() {
    EventBus.subject.next(new Event(EventType.START_LOADING, null));
  }

  onStopLoading() {
    EventBus.subject.next(new Event(EventType.STOP_LOADING, null));
  }

  onShareableModal(userId: string, projectId: string) {
    const eventPayload = {userId, projectId};
    EventBus.subject.next(new Event(EventType.SHAREABLE_MODAL, eventPayload));
  }

  onExploreModal() {
    EventBus.subject.next(new Event(EventType.OPEN_EXPLORE_MODAL, null));
  }

  onOpenFileLoader(acceptedFileType: string) {
    const eventPayload = {acceptedFileType: acceptedFileType};
    EventBus.subject.next(new Event(EventType.OPEN_FILE_LOADER, eventPayload));
  }

  onMouseDown($event) {
    const event: Event = new Event(EventType.MOUSE_DOWN, $event);
    EventBus.subject.next(event);
  }

  onHotspotVisibility(isVisible: boolean) {
    const eventPayload = {isVisible};
    const event: Event = new Event(EventType.HOTSPOT_EDITOR_VISIBILITY, eventPayload);
    EventBus.subject.next(event);
  }

}

export class Event {

  public eventType: EventType;
  public value: any;

  constructor(eventType: EventType, value: any) {
    this.eventType = eventType;
    this.value = value;
  }

}

export enum EventType {
  SELECT_PROPERTY,
  SELECT_ROOM,
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  CLICK,
  MODAL_MESSAGE,
  START_LOADING,
  STOP_LOADING,
  OPEN_FILE_LOADER,
  WINDOW_RESIZE,
  SHAREABLE_MODAL,
  OPEN_EXPLORE_MODAL,
  VR_DISPLAY_CHANGE,
  HOTSPOT_EDITOR_VISIBILITY
}
