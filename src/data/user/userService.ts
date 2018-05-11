import { Injectable } from '@angular/core';


@Injectable()
export class UserService {
  private user: any = null;

  constructor() {
  }

  authorize(block) {
    const idToken = this.user && this.user.idToken;

    if (!!idToken) {
      block('Authorization', `Token ${idToken}`);
    }
  }

  getUser() {
    return this.user;
  }

  setUser(user: any) {
    this.user = user;
  }

  clearUser() {
    this.user = null;
  }

  getUserId(): string {
    return this.user ? this.user.uid : null;
  }

  getUserName(): string {
    return this.user ? this.user.displayName : null;
  }

  getUserGroups(): string[] {
    return [];
    // const user = this.getUser();
    // if (!user || !user.groups) {
    //   return [];
    // }
    // return [].concat(user.groups, user.admin_groups);
  }

  getAdminGroups(): string[] {
    return [];
    // const user = this.getUser();
    // if (!user || !user.groups) {
    //   return [];
    // }
    // return user.admin_groups;
  }
}
