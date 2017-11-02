import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

const USERNAME_STORAGE: string = 'USERNAME_STORAGE';
const USER_STORAGE: string = 'USER_STORAGE';

@Injectable()
export class UserService {

  private user: any;

  getUser() {
    if (!this.user && sessionStorage) {
      const userString = sessionStorage.getItem(USER_STORAGE);
      this.user = JSON.parse(userString);
    }
    return this.user;
  }

  setUser(user: any) {
    if (sessionStorage) {
      sessionStorage.setItem(USER_STORAGE, JSON.stringify(user));
    }
    this.user = user;
  }

  clearUser() {
    if (sessionStorage) {
      sessionStorage.removeItem(USER_STORAGE);
    }
    this.user = undefined;
  }

  getUserId(): string {
    const user = this.getUser();
    return user && user.id + '';
  }

  getUserName(): string {
    const user = this.getUser();
    return user && user.username;
  }

  getUserGroups(): string[] {
    const user = this.getUser();
    if (!user || !user.groups) {
      return [];
    }
    return [].concat(user.groups, user.admin_groups);
  }

  getAdminGroups(): string[] {
    const user = this.getUser();
    if (!user || !user.groups) {
      return [];
    }
    return user.admin_groups;
  }

}
