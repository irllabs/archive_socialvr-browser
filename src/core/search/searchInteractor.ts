import {Injectable} from '@angular/core';

import {ApiService} from 'data/api/apiService';

@Injectable()
export class SearchInteractor {

  constructor(
    private apiService: ApiService
  ) {}

  searchPublicProjects(query: string) {
    return this.apiService.searchPublicProjects(query);
  }

}
