import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {EventBus} from 'ui/common/event-bus';
import {UserInteractor} from 'core/user/userInteractor';

@Component({
  selector: 'unauth-user-tab',
  styleUrls: ['./unauth-user-tab.scss'],
  templateUrl: './unauth-user-tab.html'
})
export class UnauthUserTab {

  private isCreatingAccount: boolean = false;
  private viewModel;
  private createUserIsUnlocked: boolean = false;

  constructor(
    private userInteractor: UserInteractor,
    private eventBus: EventBus,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.resetFields();

    this.route.queryParams
      .map(params => params['createAccount'] === 'true')
      .subscribe(
        isCreateAccount => this.createUserIsUnlocked = isCreateAccount,
        error => console.log('error', error)
      );
  }

  private resetFields() {
    this.viewModel = {
      username: '',
      password: '',
      createUsername: '',
      createPassword: '',
      createFirstname: '',
      createLastname: '',
      createEmail: ''
    };
    this.isCreatingAccount = false;
  }

  private getViewModelProperty(key): string {
    return this.viewModel[key];
  }

  private setViewModelProperty(event, key) {
    this.viewModel[key] = event.text;
  }

  private logIn($event) {
    if (!this.viewModel.username || !this.viewModel.password) {
      const errorHeader: string = 'Username Password Error';
      const errorBody: string = 'Make sure to fill out both username and password fields!';
      this.eventBus.onModalMessage(errorHeader, errorBody);
      return;
    }
    this.userInteractor.logIn(this.viewModel.username, this.viewModel.password)
      .subscribe(
        response => this.onLogin(),
        error => {
          const errorHeader: string = 'Sign in error';
          const errorBody: string = 'It looks like the username and password don\'t match.';
          this.eventBus.onModalMessage(errorHeader, errorBody);
        }
      );
  }

  private createAccount() {
    if (!this.isCreatingAccount) {
      this.isCreatingAccount = true;
      return;
    }

    if (!this.createAccountFieldsAreValid()) {
      const errorHeader: string = 'Create Account Error';
      const errorBody: string = 'Make sure to fill out all the fields';
      this.eventBus.onModalMessage(errorHeader, errorBody);
      return;
    }

    const username: string = this.viewModel.createUsername;
    const password: string = this.viewModel.createPassword;
    const firstName: string = this.viewModel.createFirstname;
    const lastName: string = this.viewModel.createLastname;
    const email: string = this.viewModel.createEmail;

    this.userInteractor.createUser(firstName, lastName, username, password, email)
      .subscribe(
        response => console.log('response', response),
        error => {
          const errorHeader: string = 'Create Account Error';
          const errorBody: string = 'We had trouble creating an account for you.';
          let message: string = '';
          let jsonError = {};
          try {
            jsonError = JSON.parse(error._body);
            message = Object.keys(jsonError)
              .map(key => jsonError[key])
              .join('\n\n');
          }
          catch (error) {}

          console.error(error);
          this.eventBus.onModalMessage(errorHeader, `${errorBody}\n${message}`);
        },
        () => this.isCreatingAccount = false
      );

  }

  private createAccountFieldsAreValid(): boolean {
    return !!this.viewModel.createUsername
        && !!this.viewModel.createPassword
        && !!this.viewModel.createFirstname
        && !!this.viewModel.createLastname
        && !!this.viewModel.createEmail;
  }

  //TODO: have interactor provide log in status and method

  private facebookLogin() {
    this.userInteractor.facebookLogin()
      .subscribe(
        success => console.log('facebook login success', success),
        error => console.log('facebook login error', error)
      );
  }

  private googleLogin() {
    console.log('google login');
    this.userInteractor.googleLogin()
      .subscribe(
        success => console.log('google login success', success),
        error => console.log('google login error', error)
      );
  }

  // TODO: Create a service to handle route change, also add route guards to user-tab
  private onLogin() {
    const isPreviewMode = this.router.url.includes('view:preview');
    const multiviewValue = this.route.snapshot.queryParams['multiview'];
    if (isPreviewMode && multiviewValue) {
        const path = {
          outlets: {
            view: 'preview',
            modal: null
          }
        };
        const extras = {
          queryParams: {
            multiview: multiviewValue
          }
        };
        this.router.navigate(['/editor', path], extras);
      }
  }

}
