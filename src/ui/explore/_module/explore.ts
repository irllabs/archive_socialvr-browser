import {
  Component,
  Input,
  ViewChild,
  HostListener
} from '@angular/core';
import {Router} from '@angular/router';

import {UserInteractor} from 'core/user/userInteractor';

@Component({
  selector: 'explore',
  styleUrls: ['./explore.scss'],
  templateUrl: './explore.html'
})
export class Explore {

  constructor(
    private userInteractor: UserInteractor
  ) {}

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn();
  }

}
