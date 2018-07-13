// Polyfills

import 'core-js/es6';
import 'core-js/es7';
import 'ie-shim'; // Internet Explorer 9 support

import * as WebVRPolyfill from 'webvr-polyfill';
import 'aframe';
import 'aframe-animation-component';
import 'aframe-look-at-component';
import 'aframe-template-component';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';

//custom browser compatibility
navigator.getUserMedia = navigator.getUserMedia || (<any>navigator).webkitGetUserMedia;
(<any>window).AudioContext = (<any>window).AudioContext || (<any>window).webkitAudioContext;

// const webVrConfig = {
//   FORCE_ENABLE_VR: false,
//   K_FILTER: 0.98,
//   PREDICTION_TIME_S: 0.04,
//   TOUCH_PANNER_DISABLED: false,
//   CARDBOARD_UI_DISABLED: false,
//   ROTATE_INSTRUCTIONS_DISABLED: false,
//   YAW_ONLY: false,
//   MOUSE_KEYBOARD_CONTROLS_DISABLED: false,
//   DEFER_INITIALIZATION: false,
//   ENABLE_DEPRECATED_API: false,
//   BUFFER_SCALE: 0.5,
//   DIRTY_SUBMIT_FRAME_BINDINGS: false,
//   ALWAYS_APPEND_POLYFILL_DISPLAY: true
// };

const polyfill = new WebVRPolyfill(); // PASS IN webVrConfig here if needed
