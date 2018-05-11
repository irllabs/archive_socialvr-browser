import { Injectable } from '@angular/core';

import { ApiService } from 'data/api/apiService';


import { Observable } from 'rxjs/Observable';

// import 'rxjs/add/operator/do';

@Injectable()
export class VideoInteractor {

  constructor(
    private apiService: ApiService,
  ) {
  }

  uploadVideo(videoFile: File): Observable<any> {
    return null;
  }

}
