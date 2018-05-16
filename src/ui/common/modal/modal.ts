import {Component} from '@angular/core';
import {ViewEncapsulation} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';

const MODAL_TYPE = {
  MESSAGE: 'MESSAGE',
  LOADER: 'LOADER',
  SHARABLE: 'SHARABLE',
  EXPLORE: 'EXPLORE',
  PLAY_STORY: 'PLAY_STORY',
};

@Component({
  selector: 'modal',
  styleUrls: ['./modal.scss'],
  templateUrl: './modal.html',
  encapsulation: ViewEncapsulation.None
})
export class Modal {

  private activeModalType: string;
  private messageData = {
    headerText: '',
    bodyText: '',
    isMessage: false
  };
  private shareableData;
  private playStoryCallback;

  private isOpen: boolean;
  private sharableId: string = '';
  private onDismiss: Function;
  private onAccept: Function;
  private subscriptions: Set<Subscription> = new Set<Subscription>();

  constructor(private eventBus: EventBus) {}

  ngOnInit() {
    this.clearValues();
    this.subscribeToEvents();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  closeModal($event) {
    if (!$event.isAccepted && this.onDismiss) {
      this.onDismiss();
    } else if ($event.isAccepted && this.onAccept) {
      this.onAccept();
    } else if (this.isPlayStoryModal() && this.playStoryCallback) {
      this.playStoryCallback();
    }
    this.clearValues();
  }

  private subscribeToEvents() {
    const onMessage: Subscription = this.eventBus.getObservable(EventType.MODAL_MESSAGE)
      .subscribe(
        event => {
          this.activeModalType = MODAL_TYPE.MESSAGE;
          this.isOpen = true;
          this.messageData.headerText = event.header;
          this.messageData.bodyText = event.body;
          this.messageData.isMessage = event.isMessage;
          this.onDismiss = event.onDismiss;
          this.onAccept = event.onAccept;
        },
        error => console.log('error', error)
      );

    const onStartLoading: Subscription = this.eventBus.getObservable(EventType.START_LOADING)
      .subscribe(
        event => {
          this.isOpen = true;
          this.activeModalType = MODAL_TYPE.LOADER;
        },
        error => {
          console.log('error', error);
          this.isOpen = false;
        }
      );

    const onStopLoading: Subscription = this.eventBus.getObservable(EventType.STOP_LOADING)
      .subscribe(
        event => this.isOpen = false,
        error => {
          console.log('error', error);
          this.isOpen = false;
        }
      );

    const onSharable: Subscription = this.eventBus.getObservable(EventType.SHAREABLE_MODAL)
      .subscribe(
        event => {
          this.isOpen = true;
          this.activeModalType = MODAL_TYPE.SHARABLE;
          this.shareableData = event;
        },
        error => {
          console.log('error', error);
          this.isOpen = false;
        }
      );

    const onPlayStory: Subscription = this.eventBus.getObservable(EventType.PLAY_STORY_MODAL)
      .subscribe(
        event => {
          this.isOpen = true;
          this.activeModalType = MODAL_TYPE.PLAY_STORY;
          this.playStoryCallback = event.callback;
        },
        error => {
          console.log('error', error);
          this.isOpen = false;
        }
      );

    const onExploreModal: Subscription = this.eventBus.getObservable(EventType.OPEN_EXPLORE_MODAL)
      .subscribe(
        event => {
          this.isOpen = true;
          this.activeModalType = MODAL_TYPE.EXPLORE;
        },
        error => {
          console.log('error', error);
          this.isOpen = false;
        }
      );

    this.subscriptions.add(onSharable);
    this.subscriptions.add(onPlayStory);
    this.subscriptions.add(onStartLoading);
    this.subscriptions.add(onStopLoading);
    this.subscriptions.add(onMessage);
    this.subscriptions.add(onExploreModal);
  }

  private clearValues() {
    this.isOpen = false;
    this.onDismiss = null;
    this.onAccept = null;
    this.messageData = {
      headerText: '',
      bodyText: '',
      isMessage: false
    };
    this.shareableData = null;
  }

  private isMessageModal() {
    return this.activeModalType === MODAL_TYPE.MESSAGE;
  }

  private isSharableModal() {
    return this.activeModalType === MODAL_TYPE.SHARABLE;
  }

  private isLoaderModal() {
    return this.activeModalType === MODAL_TYPE.LOADER;
  }

  private isPlayStoryModal() {
    return this.activeModalType === MODAL_TYPE.PLAY_STORY;
  }

}
