import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { ApiService } from 'data/api/apiService';

import { AuthenticationMethod } from 'data/authentication/authenticationMethod';
import { UserService } from 'data/user/userService';
import * as firebase from 'firebase/app';

const TOKEN_STORAGE: string = 'TOKEN_STORAGE';

@Injectable()
export class AuthService {
  private _user: any = null;
  private _idToken = null;

  public get isAuthenticated(): boolean {
    return this._user !== null;
  }

  public get user(): any {
    if (this._user !== null) {
      return {
        get id() {
          return this.uid;
        },
        uid: this._user.uid,
        displayName: this._user.displayName,
        email: this._user.email,
        providerData: this._user.providerData,
        providerId: this._user.providerId,
        idToken: this._idToken,
      };
    } else {
      return {};
    }
  }

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private afAuth: AngularFireAuth,
  ) {
    const subscription = this.afAuth.authState.subscribe((user) => {
      if (user !== null) {
        this._user = user;
        this.userService.setUser(this.user);

        return user;
      }

      subscription.unsubscribe();
    });
  }

  private _googleAuthenticate() {
    return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((result) => {
        const user = result.user;

        this._user = user;
        this.userService.setUser(this.user);

        return user;
      });
  }

  private _loginPasswordAuthenticate({ email, password }) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((user) => {
        this._user = user;
        this.userService.setUser(this.user);

        return user;
      });
  }

  public authenticate(provider, credentials = null) {
    switch (provider) {
      case AuthenticationMethod.GOOGLE: {
        return this._googleAuthenticate();
      }
      case AuthenticationMethod.FIREBASE: {
        return this._loginPasswordAuthenticate(credentials);
      }
      default: {
        return this._loginPasswordAuthenticate(credentials);
      }
    }
  }

  public invalidate() {
    this.afAuth.auth.signOut();
    this._user = null;
    this.userService.clearUser();
  }
}
