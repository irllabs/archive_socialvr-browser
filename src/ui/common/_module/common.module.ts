// Angular Modules
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule}   from '@angular/forms';

// UI components
import {Checkbox} from 'ui/common/checkbox/checkbox';
import {TextInput} from 'ui/common/text-input/text-input';
import {TextInputMaterial} from 'ui/common/text-input-material/text-input-material';

// Modal
import {Modal} from 'ui/common/modal/modal';
import {LoadingModal} from 'ui/common/modal/loading-modal/loading-modal';
import {MessageModal} from 'ui/common/modal/message-modal/message-modal';
import {ShareableModal} from 'ui/common/modal/shareable-modal/shareable-modal';
import { PlayStoryModal } from 'ui/common/modal/play-story-modal/play-story-modal';

// Services
import {EventBus} from 'ui/common/event-bus';
import {ShareableLoader} from 'ui/common/shareable-loader';

@NgModule({
  declarations: [
    Checkbox,
    TextInput,
    TextInputMaterial,
    Modal,
    LoadingModal,
    MessageModal,
    ShareableModal,
    PlayStoryModal,
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  exports: [
    Checkbox,
    TextInput,
    TextInputMaterial,
    Modal,
    LoadingModal,
    MessageModal,
    ShareableModal,
    PlayStoryModal,
  ],
  providers: [
    EventBus,
    ShareableLoader
  ]
})
export class CommonModule {}
