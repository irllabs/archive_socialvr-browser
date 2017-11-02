// Angular Modules
import {NgModule} from '@angular/core'
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {Routes} from '@angular/router';

// UI Modules
import {EditorModule} from 'ui/editor/_module/editor.module';
import {AdminModule} from 'ui/admin/_module/admin.module';
import {ExploreModule} from 'ui/explore/_module/explore.module';
import {CommonModule} from 'ui/common/_module/common.module';

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
    EditorModule,
    AdminModule,
    ExploreModule,
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
export class UiModule {}
