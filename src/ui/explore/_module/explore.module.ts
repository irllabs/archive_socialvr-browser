// Angular Modules
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule}   from '@angular/forms';


// UI components
import {Explore} from 'ui/explore/_module/explore';

import {SearchExplore} from 'ui/explore/search-explore/search-explore';
import {UserGroups} from 'ui/explore/user-groups/user-groups';

// Common UI components
import {CommonModule} from 'ui/common/_module/common.module';

// Expose core layer (interactors) to view layer
import {CoreModule} from 'core/_module/core.module';

// Module routes
const route = RouterModule.forChild([
  {path: 'explore', component: Explore}
]);


@NgModule({
  declarations: [
    Explore,
    SearchExplore,
    UserGroups
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route
  ],
})
export class ExploreModule {}
