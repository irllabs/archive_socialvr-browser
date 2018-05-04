// external imports
import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';

import {RoomManager} from 'data/scene/roomManager';
import {PropertyBuilder} from 'data/scene/roomPropertyBuilder';
import {CameraService} from 'data/scene/cameraService';
import {ApiService} from 'data/api/apiService';
import {UserService} from 'data/user/userService';
import {AuthService} from 'data/authentication/authService';
import {SocialAuthenticationService} from 'data/authentication/socialAuthenticationService';
import {DeserializationService} from 'data/storage/deserializationService';
import {SerializationService} from 'data/storage/serializationService';
import {ProjectService} from 'data/project/projectService';
import {AssetManager} from 'data/asset/assetManager';
import {AssetService} from 'data/asset/assetService';
import {ChatService} from 'data/chat/chatService';

@NgModule({
  declarations: [],
  imports: [
    HttpModule
  ],
  providers: [
    RoomManager,
    ApiService,
    UserService,
    AuthService,
    SocialAuthenticationService,
    DeserializationService,
    SerializationService,
    PropertyBuilder,
    ProjectService,
    AssetManager,
    AssetService,
    ChatService,
    CameraService
  ]
})
export class DataModule {}
