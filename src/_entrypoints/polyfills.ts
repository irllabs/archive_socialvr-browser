// Polyfills

import 'ie-shim'; // Internet Explorer 9 support

import 'core-js/es6';
import 'core-js/es7';

// import 'core-js/es7/reflect';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';

import 'webvr-polyfill';

//custom browser compatibility
navigator.getUserMedia = navigator.getUserMedia || (<any>navigator).webkitGetUserMedia;
(<any>window).AudioContext = (<any>window).AudioContext || (<any>window).webkitAudioContext;


// (<any>window).WebVRConfig = {
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
