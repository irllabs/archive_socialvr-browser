// Angular Modules
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule}   from '@angular/forms';

// UI components
import {Editor} from 'ui/editor/_module/editor';

// Editor
import {EditSpaceFlat} from 'ui/editor/edit-space/edit-space-flat/edit-space-flat';
import {EditSpaceSphere} from 'ui/editor/edit-space/edit-space-sphere/edit-space-sphere';
import {DefaultOverlay} from 'ui/editor/edit-space/default-overlay/default-overlay';
import {RoomIcon} from 'ui/editor/edit-space/room-icon/room-icon/room-icon';
import {PropertyEditor} from 'ui/editor/edit-space/room-icon/property-editor/property-editor/property-editor';
import {TextEditor} from 'ui/editor/edit-space/room-icon/property-editor/text-editor/text-editor';
import {ImageEditor} from 'ui/editor/edit-space/room-icon/property-editor/image-editor/image-editor';
import {DoorEditor} from 'ui/editor/edit-space/room-icon/property-editor/door-editor/door-editor';
import {LinkEditor} from 'ui/editor/edit-space/room-icon/property-editor/link-editor/link-editor';
import {AudioEditor} from 'ui/editor/edit-space/room-icon/property-editor/audio-editor/audio-editor';
import {AudioRecorder} from 'ui/editor/util/audio-recorder/audio-recorder';

// Preview mode
// TODO: make into separate module
import {PreviewSpace} from 'ui/editor/preview-space/preview-space/preview-space';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';
import {MultiViewService} from 'ui/editor/preview-space/modules/multiViewService';
import {AudioManager} from 'ui/editor/preview-space/modules/audioManager';
import {TextureLoader} from 'ui/editor/preview-space/modules/textureLoader';
import {HotspotManager} from 'ui/editor/preview-space/modules/hotspotManager';
import {MenuManager} from 'ui/editor/preview-space/modules/menuManager';
import {Reticle} from 'ui/editor/preview-space/modules/reticle';

// Topbar
import {Topbar} from 'ui/editor/topbar/topbar/topbar';
import {AboutTab} from 'ui/editor/topbar/about/about';

// Modals
import {UserTab} from 'ui/editor/modal/profile/user-tab/user-tab';
import {UnauthUserTab} from 'ui/editor/modal/profile/unauth-tab/unauth-user-tab';
import {AuthUserTab} from 'ui/editor/modal/profile/auth-tab/auth-user-tab';
import {TreeTab} from 'ui/editor/modal/story/tree-tab/tree-tab';
import {RowItem} from 'ui/editor/modal/story/row-item/row-item';
import {Story} from 'ui/editor/modal/story/story';
import {ModalClose} from 'ui/editor/modal/modal-close/modal-close';
import {Upload} from 'ui/editor/modal/upload/upload';

// Bottombar
import {HotspotMenu} from 'ui/editor/bottombar/hotspot-menu/hotspot-menu/hotspot-menu';
import {Fab} from 'ui/editor/bottombar/hotspot-menu/fab/fab';
import {ActionMenu} from 'ui/editor/bottombar/hotspot-menu/action-menu/action-menu';
import {RoomEditor} from 'ui/editor/bottombar/room-editor/room-editor/room-editor';
import {RoomEditorIcon} from 'ui/editor/bottombar/room-editor/room-editor-icon/room-editor-icon';
import {EditSpaceToggle} from 'ui/editor/bottombar/edit-space-toggle/edit-space-toggle';
import {StoryScroll} from 'ui/editor/bottombar/story-scroll/story-scroll';
import {StorymapItem} from 'ui/editor/bottombar/story-scroll/storymap-item/storymap-item'
import {AddRoomButton} from 'ui/editor/bottombar/story-scroll/add-room/add-room'
import {Fullscreen} from 'ui/editor/bottombar/fullscreen/fullscreen';

// Util
import {DraggableIcon} from 'ui/editor/util/draggable';
import {Droppable} from 'ui/editor/util/droppable';
import {FileLoader} from 'ui/editor/util/file-loader/file-loader';
import {HiddenFileLoader} from 'ui/editor/util/hidden-file-loader/hidden-file-loader';
import {FileLoaderMulti} from 'ui/editor/util/file-loader-multi/file-loader-multi';
import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';
import {PropertyRemovalService} from 'ui/editor/util/propertyRemovalService';
import {CloseButton} from 'ui/editor/util/close-button/close-button';
import {InfoButton} from 'ui/editor/util/info-button/info-button';
import {ZipFileReader} from 'ui/editor/util/zipFileReader';
import {AudioRecorderService} from 'ui/editor/util/audioRecorderService';
import {CombinedHotspotUtil} from 'ui/editor/util/combinedHotspotUtil';
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';
import {Slider} from 'ui/editor/util/slider/slider';
import {ResponsiveUtil} from 'ui/editor/util/responsiveUtil';

// Common UI components
import {CommonModule} from 'ui/common/_module/common.module';

// Expose core layer (interactors) to view layer
import {CoreModule} from 'core/_module/core.module';

// Module routes
const route = RouterModule.forChild([
  {
    path: 'editor',
    component: Editor,
    children: [
      {
        path: '',
        redirectTo: '/editor/(view:flat)',
        pathMatch: 'full'
      },
      {
        path: 'flat',
        component: EditSpaceFlat,
        outlet: 'view'
      },
      {
        path: 'sphere',
        component: EditSpaceSphere,
        outlet: 'view'
      },
      {
        path: 'preview',
        component: PreviewSpace,
        outlet: 'view'
      },
      {
        path: 'profile',
        component: UserTab,
        outlet: 'modal'
      },
      {
        path: 'story',
        component: Story,
        outlet: 'modal'
      },
      {
        path: 'upload',
        component: Upload,
        outlet: 'modal'
      }

    ]
  }
]);

@NgModule({
  declarations: [
    Editor,
    EditSpaceFlat,
    EditSpaceSphere,
    PreviewSpace,
    Topbar,
    RoomIcon,
    RoomEditorIcon,
    PropertyEditor,
    TextEditor,
    ImageEditor,
    AudioEditor,
    DoorEditor,
    RoomEditor,
    LinkEditor,
    DraggableIcon,
    Droppable,
    FileLoader,
    HiddenFileLoader,
    FileLoaderMulti,
    TreeTab,
    RowItem,
    UserTab,
    UnauthUserTab,
    AuthUserTab,
    ActionMenu,
    CloseButton,
    InfoButton,
    DefaultOverlay,
    EditSpaceToggle,
    AboutTab,
    Story,
    ModalClose,
    Upload,
    Fab,
    HotspotMenu,
    AudioRecorder,
    Slider,
    StoryScroll,
    StorymapItem,
    AddRoomButton,
    Fullscreen
  ],
  imports: [
    BrowserModule,
    CoreModule,
    CommonModule,
    FormsModule,
    route
  ],
  providers: [
    FileLoaderUtil,
    PropertyRemovalService,
    ZipFileReader,
    AudioRecorderService,
    CombinedHotspotUtil,
    AudioPlayService,
    SlideshowBuilder,
    ResponsiveUtil,
    MultiViewService,
    AudioManager,
    TextureLoader,
    HotspotManager,
    MenuManager,
    Reticle
  ]
})
export class EditorModule {}
