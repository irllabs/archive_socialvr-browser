import { Component, ViewChild } from '@angular/core';
import { AdminInteractor } from 'core/admin/adminInteractor';

import { UserInteractor } from 'core/user/userInteractor';

@Component({
  selector: 'admin',
  styleUrls: ['./admin.scss'],
  templateUrl: './admin.html',
})
export class Admin {

  @ViewChild('adminUserGroups') adminUserGroupsElement;

  constructor(
    private userInteractor: UserInteractor,
    private adminInteractor: AdminInteractor,
  ) {
  }

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn() && this.adminInteractor.isAdmin();
  }

  private onAddProject($event) {
    this.adminUserGroupsElement.onAddProject($event);
  }

}
