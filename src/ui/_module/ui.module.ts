// Angular Modules
import {NgModule} from '@angular/core'
import {RouterModule} from '@angular/router';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';

import {AngularFireModule} from 'angularfire2';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {ENV} from '../../config/environment';

// UI Modules
import {EditorModule} from 'ui/editor/_module/editor.module';
import {AdminModule} from 'ui/admin/_module/admin.module';
import {ExploreModule} from 'ui/explore/_module/explore.module';
import {ChatModule} from 'ui/chat/_module/chat.module';

// UI components
import {Ui} from 'ui/_module/ui';

// Module routes
const routes = RouterModule.forRoot([
  {path: '**', redirectTo: 'editor', pathMatch: 'full'}
]);

@NgModule({
  declarations: [
    Ui
  ],
  imports: [
    AngularFireModule.initializeApp(ENV.firebase),
    AngularFireAuthModule,

    EditorModule,
    AdminModule,
    ExploreModule,
    ChatModule,
    routes
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  bootstrap: [Ui]
})
export class UiModule {
}
