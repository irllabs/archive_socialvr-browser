import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SocialAuthenticationService {

  constructor() {
  }

  facebookLogin(): Observable<any> {
    const FB = (<any>window).FB;
    const fbLogin = new Promise((resolve, reject) => {
      FB.login(response => {
        console.log('on facebook log in', response);
        if (response.status === 'connected') {
          resolve(response);
        }
        else {
          reject(response.error);
        }
      });
    });
    return Observable.fromPromise(fbLogin);
  }

  googleLogin(): Observable<any> {
    const gapi = (<any>window).gapi;
    return Observable.fromPromise(
      gapi.auth2.getAuthInstance().signIn(),
    );
  }

  facebookLogout() {
    (<any>window).FB.api('/me/permissions', 'delete', response => {
      console.log('facebook logout', response);
    });
  }

  googleLogout() {
    (<any>window).gapi.auth2.getAuthInstance().signOut().then(() => {
      console.log('User signed out.');
    });
  }

}
