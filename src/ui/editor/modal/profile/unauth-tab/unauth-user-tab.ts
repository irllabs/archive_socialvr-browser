import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssetInteractor } from 'core/asset/assetInteractor';
import { UserInteractor } from 'core/user/userInteractor';
import { EventBus } from 'ui/common/event-bus';

@Component({
  selector: 'unauth-user-tab',
  styleUrls: ['./unauth-user-tab.scss'],
  templateUrl: './unauth-user-tab.html',
})
export class UnauthUserTab implements OnInit, OnDestroy {
  private user: any = null;

  constructor(
    private router: Router,
    private assetInteractor: AssetInteractor,
    private userInteractor: UserInteractor,
    private eventBus: EventBus,
  ) {
  }

  ngOnInit() {
    this.user = {
      email: '',
      password: '',
    };
  }

  ngOnDestroy() {
    // this._authStateSubscription.unsubscribe();
  }

  private _onError() {
    const errorHeader: string = 'Sign in error';
    const errorBody: string = 'It looks like the email and password don\'t match.';

    this.eventBus.onModalMessage(errorHeader, errorBody);
  }

  public onLogin() {
    if (!this.user.email || !this.user.password) {
      const errorHeader: string = 'Email Password Error';
      const errorBody: string = 'Make sure to fill out both email and password fields!';

      this.eventBus.onModalMessage(errorHeader, errorBody);
      return;
    }

    this.userInteractor.login(this.user.email, this.user.password).catch(this._onError.bind(this));
  }

  public onLoginWithGoogle() {
    this.userInteractor.loginWithGoogle().catch(this._onError.bind(this));
  }

  public onOpenClick() {
    if (!this.userInteractor.isLoggedIn()) {
      this.eventBus.onModalMessage('Error', 'You must be logged in to download as .zip');
      return;
    }

    this.eventBus.onOpenFileLoader('zip');
    this.router.navigate(['/editor', { outlets: { 'view': 'flat', modal: null } }]);

    return;
  }
}
