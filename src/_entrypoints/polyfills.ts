// Polyfills

import 'core-js/es6';
import 'core-js/es7';
import 'ie-shim'; // Internet Explorer 9 support
import 'aframe';
import 'aframe-look-at-component';
import 'mediaelement/full'
import 'zone.js/dist/zone';

// disable the long-stack-trace-zone for prod
import 'zone.js/dist/long-stack-trace-zone';

//custom browser compatibility
navigator.getUserMedia = navigator.getUserMedia || (<any>navigator).webkitGetUserMedia;
(<any>window).AudioContext = (<any>window).AudioContext || (<any>window).webkitAudioContext;
