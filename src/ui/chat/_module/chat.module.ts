// Angular Modules
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
// Expose core layer (interactors) to view layer
import { CoreModule } from 'core/_module/core.module';
// UI components
import { Chat } from 'ui/chat/_module/chat';
// Common UI components
import { CommonModule } from 'ui/common/_module/common.module';

// Module routes
const route = RouterModule.forChild([
  { path: 'chat', component: Chat },
]);


@NgModule({
  declarations: [
    Chat,
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route,
  ],
})
export class ChatModule {
}
