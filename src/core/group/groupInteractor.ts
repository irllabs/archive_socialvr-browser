import {Injectable} from '@angular/core';

import {ApiService} from 'data/api/apiService';

import {Observable} from 'rxjs/Observable';

@Injectable()
export class GroupInteractor {

  constructor(
    private apiService: ApiService
  ) {}

  getGroup(groupId: string) {
    return this.apiService.getGroup(groupId);
  }

}
