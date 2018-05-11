import { Injectable } from '@angular/core';

import { ProjectInteractor } from '../project/projectInteractor';

@Injectable()
export class SearchInteractor {

  constructor(
    private projectInteractor: ProjectInteractor,
  ) {
  }

  searchPublicProjects(query: string) {
    return this.projectInteractor.searchPublicProjects(query);
  }

}
