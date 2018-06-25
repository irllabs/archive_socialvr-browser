import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { UiModule } from '../ui/_module/ui.module';

const build = require('build');

if (build === 'PROD') {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(UiModule)
  .catch(err => console.error(err));

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('sw.js')
//       .catch(error => {
//         console.log('ServiceWorker registration failed: ', error);
//       });
//   });
// }
