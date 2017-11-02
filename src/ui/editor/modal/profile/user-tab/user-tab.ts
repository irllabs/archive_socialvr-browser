import {Component, ViewEncapsulation} from '@angular/core';
import {BaseModal} from 'ui/editor/modal/base-modal';
import {UserInteractor} from 'core/user/userInteractor';
import {Router} from '@angular/router';

@Component({
  selector: 'user-tab',
  styleUrls: ['./user-tab.scss'],
  templateUrl: './user-tab.html',
  encapsulation: ViewEncapsulation.None
})
export class UserTab {

  constructor(
    private userInteractor: UserInteractor,
    private router: Router
  ) {}

  private userIsLoggedIn(): boolean {
    return this.userInteractor.isLoggedIn();
  }

  onOffClick($event) {
    //console.log('onOffClick user-tab');
    if (!$event.isOffClick) return;
    this.router.navigate(['/editor', {outlets: {'modal': ''}}]);
  }
}
