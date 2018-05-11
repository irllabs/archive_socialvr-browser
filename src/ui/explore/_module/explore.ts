import { Component } from '@angular/core';

import { UserInteractor } from 'core/user/userInteractor';

@Component({
  selector: 'explore',
  styleUrls: ['./explore.scss'],
  templateUrl: './explore.html',
})
export class Explore {

  constructor(
    private userInteractor: UserInteractor,
  ) {
  }

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn();
  }

}
