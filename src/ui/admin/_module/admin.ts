import {Component, ViewChild} from '@angular/core';
import {Router} from '@angular/router';

import {UserInteractor} from 'core/user/userInteractor';
import {AdminInteractor} from 'core/admin/adminInteractor';

@Component({
  selector: 'admin',
  styleUrls: ['./admin.scss'],
  templateUrl: './admin.html'
})
export class Admin {

  @ViewChild('adminUserGroups') adminUserGroupsElement;

  constructor(
    private userInteractor: UserInteractor,
    private adminInteractor: AdminInteractor
  ) {}

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn() && this.adminInteractor.isAdmin();
  }

  private onAddProject($event) {
    this.adminUserGroupsElement.onAddProject($event);
  }

}
