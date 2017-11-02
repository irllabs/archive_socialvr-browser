import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {enableProdMode} from '@angular/core';
import {initializeApp} from 'firebase';

import {UiModule} from '../ui/_module/ui.module';
const build = require('build');

if (build === 'PROD') {
  enableProdMode();
}

const firebaseConfig = {
  apiKey: "AIzaSyC5Q5Ie9To_fE2Yk8jOq1BCjIlV-9SEqQM",
  authDomain: "social-vr-161302.firebaseapp.com",
  databaseURL: "https://social-vr-161302.firebaseio.com",
  projectId: "social-vr-161302",
  storageBucket: "social-vr-161302.appspot.com",
  messagingSenderId: "613942124685"
};
initializeApp(firebaseConfig);

platformBrowserDynamic().bootstrapModule(UiModule)
  .catch(err => console.error(err));

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('sw.js')
//       .catch(error => {
//         console.log('ServiceWorker registration failed: ', error);
//       });
//   });
// }
