import { Injectable } from '@angular/core';

import { ApiService } from 'data/api/apiService';
import { AuthenticationMethod } from 'data/authentication/authenticationMethod';
import { AuthService } from 'data/authentication/authService';
import { UserService } from 'data/user/userService';


@Injectable()
export class UserInteractor {

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private authService: AuthService,
  ) {
  }

  login(email: string, password: string) {
    return this.authService.authenticate(AuthenticationMethod.FIREBASE, { email, password });
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
