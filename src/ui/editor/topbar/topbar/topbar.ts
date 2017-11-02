import {Component, NgZone} from '@angular/core';
import {UserInteractor} from 'core/user/userInteractor';
import {EventBus} from 'ui/common/event-bus';
import {Router} from '@angular/router';

@Component({
  selector: 'topbar',
  styleUrls: ['./topbar.scss'],
  templateUrl: './topbar.html'
})
export class Topbar {

  private isInFlatMode: boolean = true;

  private menuState = {
    about: false
  };

  constructor(
    private ngZone: NgZone,
    private eventBus: EventBus,
    private userInteractor: UserInteractor,
    private router: Router
  ) {}

  private onMenuItemClick(key) {
    if (this.menuState[key] === undefined) return;
    this.menuState[key] = !this.menuState[key];
    this.eventBus.onHotspotVisibility(this.menuState[key]);
  }

  private onOffMenuItemClick($event, key) {
    if (!$event.isOffClick || this.menuState[key] === undefined || !this.menuState[key]) return;
    this.ngZone.run(() => {
      this.menuState[key] = false;
      this.eventBus.onHotspotVisibility(this.menuState[key]);
    });
  }

  private userIsLoggedIn(): boolean {
    return this.userInteractor.isLoggedIn();
  }

  private setEditPlaySliderIsVisible(): boolean {
    return false;
  }





}
