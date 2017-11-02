import {Injectable} from '@angular/core';

import {AuthenticationMethod} from 'data/authentication/authenticationMethod';

const TOKEN_STORAGE: string = 'TOKEN_STORAGE';

@Injectable()
export class AuthenticationService {

  private token: string;
  private authMethod: AuthenticationMethod;

  constructor() {}

  getToken(): string {
    if (!this.token && sessionStorage) {
      this.token = sessionStorage.getItem(TOKEN_STORAGE);
    }
    return this.token;
  }

  setToken(token: string) {
    if (sessionStorage) {
      sessionStorage.setItem(TOKEN_STORAGE, token);
    }
    this.token = token;
  }

  getAuthenticationMethod(): AuthenticationMethod {
    return this.authMethod;
  }

  setAuthenticationMethod(authMethod: AuthenticationMethod) {
    this.authMethod = authMethod;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logOut() {
    if (sessionStorage) {
      sessionStorage.removeItem(TOKEN_STORAGE);
    }
    this.token = undefined;
    this.authMethod = undefined;
  }

}
