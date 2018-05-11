// Angular Modules
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
// Expose core layer (interactors) to view layer
import { CoreModule } from 'core/_module/core.module';
// Common UI components
import { CommonModule } from 'ui/common/_module/common.module';
// UI components
import { Explore } from 'ui/explore/_module/explore';

import { SearchExplore } from 'ui/explore/search-explore/search-explore';
import { UserGroups } from 'ui/explore/user-groups/user-groups';
import { ProjectThumbnail } from '../project-thumbnail/project-thumbnail';

// Module routes
const route = RouterModule.forChild([
  { path: 'explore', component: Explore },
]);


@NgModule({
  declarations: [
    Explore,
    SearchExplore,
    UserGroups,
    ProjectThumbnail,
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route,
  ],
})
export class ExploreModule {
}
