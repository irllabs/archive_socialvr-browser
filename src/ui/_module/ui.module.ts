// Angular Modules
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireStorageModule } from 'angularfire2/storage';

// UI components
import { Ui } from 'ui/_module/ui';
import { AdminModule } from 'ui/admin/_module/admin.module';
import { ChatModule } from 'ui/chat/_module/chat.module';

// UI Modules
import { EditorModule } from 'ui/editor/_module/editor.module';
import { ExploreModule } from 'ui/explore/_module/explore.module';
import { ENV } from '../../config/environment';

// Module routes
const Routes = RouterModule.forRoot([
  { path: '**', redirectTo: 'editor', pathMatch: 'full' },
]);

@NgModule({
  declarations: [
    Ui,
  ],
  imports: [
    AngularFireModule.initializeApp(ENV.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,

    EditorModule,
    AdminModule,
    ExploreModule,
    ChatModule,
    Routes,
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
  ],
  bootstrap: [Ui],
})
export class UiModule {
  constructor(private afStore: AngularFirestore) {
    afStore.app.firestore().settings(ENV.firebaseStore);
  }
}
