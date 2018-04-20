import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Router} from '@angular/router';
import {EventBus} from 'ui/common/event-bus';
import {UserInteractor} from 'core/user/userInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import { AuthService, AppGlobals } from 'angular2-google-login';

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
    private router: Router,
    private assetInteractor: AssetInteractor,
    private userInteractor: UserInteractor,
    private eventBus: EventBus,
    private route: ActivatedRoute
  ) {}


  ngOnInit() {
    this.resetFields();

    this.route.queryParams
      .map(params => params['createaccount'] === 'true')
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
  private GooglelogIn($event) {
  providers: [AuthService];

}




  declare const gapi: any;
  public auth2: any;
  public googleInit() {
    gapi.load('auth2', () => {
      this.auth2 = gapi.auth2.init({
        client_id: '731753835526-u5nt60tu5nhv7mfhd56cnqdenqc504ie.apps.googleusercontent.com',
        cookiepolicy: 'single_host_origin',
        scope: 'profile email'
      });
      this.attachSignin(document.getElementById('googleBtn'));
    });
  }
  public attachSignin(element) {
    this.auth2.attachClickHandler(element, {},
      (googleUser) => {

        let profile = googleUser.getBasicProfile();
        console.log('Token || ' + googleUser.getAuthResponse().id_token);
        console.log('ID: ' + profile.getId());
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail());
        let username = profile.getEmail();
        let  name = profile.getName();
        console.log(username);
        console.log(name);
        //YOUR CODE HERE
        this.userInteractor.googlelogIn(username, name).subscribe(

            response => this.onLogin(),
            error => {
              const errorHeader: string = 'Google Error';
              const errorBody: string = 'Google login have some issue. please try again';
              this.eventBus.onModalMessage(errorHeader, errorBody);
            }
          );

      }, (error) => {
        console.log(error['error']);
        //alert(JSON.stringify(error, undefined, 2));
        const errorHeader: string = 'Google Error';
          const errorBody: string = error['error'];
          this.eventBus.onModalMessage(errorHeader, errorBody);
      });
  }

ngAfterViewInit(){
      this.googleInit();
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
    this.userInteractor.googleLogin()
      .subscribe(
        success => console.log('google login success', success),
        error => console.log('google login error', error)
      );
  }

  private signOutTest() {
    //stub
  }

  private onLogin() {
    //this.eventBus.onShareableModal();
    //If post login intent needs to be used
    this.assetInteractor.setUploadPolicy()
      .subscribe(
        response => console.log('S3 policy set'),
        error => console.error(error)
      )
  }

  private onOpenClick($event) {
    //console.log('onNewStoryClick 1');\
    this.eventBus.onOpenFileLoader('zip');
    this.router.navigate(['/editor', {outlets: {'view': 'flat', modal: null}}]);
    return;

  }
  private getHomeTimeline(){
    this.twitter.get(
      'https://api.twitter.com/1.1/statuses/home_timeline.json',
      {
        count: 5
      },
      {
        consumerKey: 'xGLas9OfNpBCUAOhhtSbpUmgC',
        consumerSecret: 'Suy0wcwDaG0SOKVnVPkjzggdIX4tcjLKdEtjE6fGlGxtLDoEu5'
      },
      {
        token: '984414779895832576-H8oyh5BtwZ3t3ZLllfbHECnbfaQi8SH',
        tokenSecret: 'kQIRueRdW8xYV6vCqqd180L5M3ZoNWLp495OG5mLXPQMf'
      }
  ).subscribe((res)=>{
      this.result = res.json().map(tweet => tweet.text; console.log(tweet.text););
  });
  }
}
