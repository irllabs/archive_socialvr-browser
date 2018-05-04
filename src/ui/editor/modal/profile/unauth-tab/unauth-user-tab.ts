import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {EventBus} from 'ui/common/event-bus';
import {UserInteractor} from 'core/user/userInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';

@Component({
  selector: 'unauth-user-tab',
  styleUrls: ['./unauth-user-tab.scss'],
  templateUrl: './unauth-user-tab.html'
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
      username: '',
      password: ''
    }
  }

  ngOnDestroy() {
    // this._authStateSubscription.unsubscribe();
  }

  private _onLoginSuccess() {
    // If post login intent needs to be used
    this.assetInteractor.setUploadPolicy();
  }

  private _onError(){
    const errorHeader: string = 'Sign in error';
    const errorBody: string = 'It looks like the username and password don\'t match.';

    this.eventBus.onModalMessage(errorHeader, errorBody);
  }

  public onLogin() {
    if (!this.user.username || !this.user.password) {
      const errorHeader: string = 'Username Password Error';
      const errorBody: string = 'Make sure to fill out both username and password fields!';

      this.eventBus.onModalMessage(errorHeader, errorBody);
      return;
    }

    this.userInteractor
      .login(this.user.username, this.user.password)
      .then(
        () => {
          this._onLoginSuccess();
        },
        this._onError.bind(this)
      );
  }

  public onLoginWithGoogle() {
    this.userInteractor
      .loginWithGoogle()
      .then(
        () => {
          this._onLoginSuccess();
        },
        this._onError.bind(this)
      );
  }

  public onOpenClick() {
    //console.log('onNewStoryClick 1');\
    this.eventBus.onOpenFileLoader('zip');
    this.router.navigate(['/editor', {outlets: {'view': 'flat', modal: null}}]);

    return;
  }

}
