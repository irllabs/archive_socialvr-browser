import { Injectable } from '@angular/core';
import { AssetManager } from 'data/asset/assetManager';

import { DeserializationService } from 'data/storage/deserializationService';
import { SerializationService } from 'data/storage/serializationService';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class StorageInteractor {

  constructor(
    private deserializationService: DeserializationService,
    private serializationService: SerializationService,
    private assetManager: AssetManager,
  ) {
  }

  serializeProject(): Observable<any> {
    return this.serializationService.zipStoryFile();
  }

  deserializeProject(file: any): Observable<any> {
    return this.deserializationService.unzipStoryFile(file)
      .do(_ => this.assetManager.clearAssets());
  }

}
