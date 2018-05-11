import { Injectable } from '@angular/core';
import { ApiService } from 'data/api/apiService';

import { UserService } from 'data/user/userService';


@Injectable()
export class AdminInteractor {

  constructor(
    private userService: UserService,
    private apiService: ApiService,
  ) {
  }

  isAdmin(): boolean {
    return !!this.userService.getAdminGroups().length;
  }

  getAdminGroups(): any[] {
    return this.userService.getAdminGroups();
  }

  getAllProjectsInGroup(groupId: string) {
    return this.apiService.getAllProjectsInGroup(groupId);
  }

  setProjectInGroup(groupId: string, projectId: string, isIn: boolean, projectType: string) {
    return this.apiService.setProjectInGroup(groupId, projectId, isIn, projectType);
  }

}
