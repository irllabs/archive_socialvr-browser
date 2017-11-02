// Angular Modules
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule}   from '@angular/forms';

// Editor Module
import {Editor} from 'ui/editor/_module/editor';

// UI components
import {Admin} from 'ui/admin/_module/admin';
import {AdminUserGroups} from 'ui/admin/admin-user-groups/admin-user-groups';
import {AdminSearchExplore} from 'ui/admin/admin-search-explore/admin-search-explore';

// Common UI components
import {CommonModule} from 'ui/common/_module/common.module';

// Expose core layer (interactors) to view layer
import {CoreModule} from 'core/_module/core.module';

// Module routes
const route = RouterModule.forChild([
  {path: 'admin', component: Admin}
]);


@NgModule({
  declarations: [
    Admin,
    AdminUserGroups,
    AdminSearchExplore
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route
  ],
  providers: []
})
export class AdminModule {}
