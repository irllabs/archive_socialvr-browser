import {
  Directive,
  EventEmitter,
  ElementRef,
  Output
} from '@angular/core';

import {Subscription} from 'rxjs/Subscription';
import {EventBus, EventType} from 'ui/common/event-bus';

@Directive({
  selector: '[off-click]'
})
export class OffClick {

  @Output() onOffClick = new EventEmitter();

  private subscriptions: Set<Subscription> = new Set<Subscription>();

  constructor(
    private element: ElementRef,
    private eventBus: EventBus
  ) {}

  ngOnInit() {
    const onClick: Subscription = this.eventBus.getObservable(EventType.MOUSE_DOWN)
      .subscribe(
        event => {
          const isClicked: boolean = this.element.nativeElement.contains(event.target);
          this.onOffClick.emit({isOffClick: !isClicked});
        },
        error => console.log('error', error)
      );

    this.subscriptions.add(onClick);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

}
