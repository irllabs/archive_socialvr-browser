import {Injectable} from '@angular/core';

import {ApiService} from 'data/api/apiService';
import {UserService} from 'data/user/userService';
import {AuthService} from 'data/authentication/authService';
import {AuthenticationMethod} from 'data/authentication/authenticationMethod';


@Injectable()
export class UserInteractor {

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  login(username: string, password: string) {
    return this.authService.authenticate(AuthenticationMethod.SOCIAL_VR, {username, password});
  }

  loginWithGoogle() {
    return this.authService.authenticate(AuthenticationMethod.GOOGLE);
  }

  isLoggedIn() {
    return this.authService.isAuthenticated;
  }

  logOut() {
    return this.authService.invalidate();
  }

  getUser() {
    return this.userService.getUser();
  }

  getUserName(): string {
    return this.userService.getUserName();
  }

  getUserId(): string {
    return this.userService.getUserId();
  }

  // TODO: get rid
  getUserGroups(): string[] {
    return this.userService.getUserGroups();
  }
}
