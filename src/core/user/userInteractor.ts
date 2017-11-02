import {Injectable} from '@angular/core';

import {ApiService} from 'data/api/apiService';
import {UserService} from 'data/user/userService';
import {AuthenticationService} from 'data/authentication/authenticationService';
import {SocialAuthenticationService} from 'data/authentication/socialAuthenticationService';
import {AuthenticationMethod} from 'data/authentication/authenticationMethod';


import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/do';

@Injectable()
export class UserInteractor {

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private authenticationService: AuthenticationService,
    private socialAuthenticationService: SocialAuthenticationService
  ) {}

  logIn(userName: string, password: string) {
    return this.apiService.logIn(userName, password)
      .switchMap(token => {
        this.authenticationService.setToken(token);
        this.authenticationService.setAuthenticationMethod(AuthenticationMethod.SOCIAL_VR);
        return this.getUser();
      });
  }

  //TODO: map response to api service
  facebookLogin() {
    return this.socialAuthenticationService.facebookLogin()
      .do(response => {
        // TODO: set token
        this.authenticationService.setAuthenticationMethod(AuthenticationMethod.FACEBOOK);
      });
  }

  //TODO: map response to api service
  googleLogin() {
    return this.socialAuthenticationService.googleLogin()
      .do(response => {
        // TODO: set token
        this.authenticationService.setAuthenticationMethod(AuthenticationMethod.GOOGLE);
      });
  }

  isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }

  logOut() {
    return this.apiService.logOut()
      .do(response => {
        this.authenticationService.logOut();
        this.userService.clearUser();
      });
  }

  //TODO: auto log in
  createUser(firstName: string, lastName: string, userName: string, password: string, email: string) {
    return this.apiService.createUser(firstName, lastName, userName, password, email);
  }

  getUser() {
    return this.apiService.getUser()
      .do(user => this.userService.setUser(user));
  }

  getUserName(): string {
    return this.userService.getUserName();
  }

  getUserId(): string {
    return this.userService.getUserId();
  }

  getUserGroups(): string[] {
    return this.userService.getUserGroups();
  }

}
