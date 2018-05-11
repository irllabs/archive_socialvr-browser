// Angular Modules
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
// Expose core layer (interactors) to view layer
import { CoreModule } from 'core/_module/core.module';
// UI components
import { Admin } from 'ui/admin/_module/admin';
import { AdminSearchExplore } from 'ui/admin/admin-search-explore/admin-search-explore';
import { AdminUserGroups } from 'ui/admin/admin-user-groups/admin-user-groups';
// Common UI components
import { CommonModule } from 'ui/common/_module/common.module';
// Editor Module

// Module routes
const route = RouterModule.forChild([
  { path: 'admin', component: Admin },
]);


@NgModule({
  declarations: [
    Admin,
    AdminUserGroups,
    AdminSearchExplore,
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route,
  ],
  providers: [],
})
export class AdminModule {
}
