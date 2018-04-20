// external imports
import {NgModule} from '@angular/core';

// project module imports
import {DataModule} from 'data/_module/data.module';

// internal module imports
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {CameraInteractor} from 'core/scene/cameraInteractor';
import {StorageInteractor} from 'core/storage/storageInteractor';
import {UserInteractor} from 'core/user/userInteractor';
import {ProjectInteractor} from 'core/project/projectInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import {VideoInteractor} from 'core/video/videoInteractor';
import {SearchInteractor} from 'core/search/searchInteractor';
import {AdminInteractor} from 'core/admin/adminInteractor';
import {GroupInteractor} from 'core/group/groupInteractor';
import {ChatInteractor} from 'core/chat/chatInteractor';

@NgModule({
  declarations: [],
  imports: [
    DataModule
  ],
  providers: [
    SceneInteractor,
    MetaDataInteractor,
    CameraInteractor,
    StorageInteractor,
    UserInteractor,
    ProjectInteractor,
    AssetInteractor,
    VideoInteractor,
    SearchInteractor,
    AdminInteractor,
    GroupInteractor,
    ChatInteractor
  ]
})
export class CoreModule {}
