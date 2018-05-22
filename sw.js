var serviceWorkerOption = {
  "assets": [
    "/vendor.ee478b762ac920bc332b.js",
    "/main.c7149fc985304fbe4e9b.js",
    "/polyfills.e56dca039c6c2723d020.js"
  ]
};
        
        /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", { value: true });
var cache_list_1 = __webpack_require__(1);
var swVersion = '001'; // TODO: generate dynamically
var CACHE_NAME = "svr-sw-" + swVersion;
var whitelist = ['localhost', 'localhost:3000', 'cmuartfab.github.io/social-vr'];
function stringContains(str, list) {
    return list.some(function (pattern) {
        return str.indexOf(pattern) > -1;
    });
}
// TODO: add service worker types
self.addEventListener('install', function ($event) {
    $event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(cache_list_1.default);
    }).catch(function (error) {
        return console.log('error', error);
    }));
});
self.addEventListener('fetch', function ($event) {
    var request = $event.request;
    if (!stringContains(request.url, whitelist)) {
        return;
    }
    $event.respondWith(caches.match($event.request).then(function (response) {
        return response ? response : fetch(request);
    }).catch(function (error) {
        return console.log('fetch error', error);
    }));
});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", { value: true });
var pathName = location.pathname;
var defaultIndexPath = pathName.substring(0, pathName.lastIndexOf('sw.js'));
var images = ['assets/icons/icon-audio.png', 'assets/icons/back_filled.png', 'assets/icons/icon-doorhotspot.png', 'assets/icons/home_filled.png', 'assets/icons/home.png', 'assets/icons/icon-hotspot-default.png', 'assets/icons/icon-hotspot-hover.png', 'assets/icons/icon-add.png', 'assets/icons/icon-home.png', 'assets/icons/icon-image.png', 'assets/icons/icon-image-text.png', 'assets/icons/icon-image-audio.png', 'assets/icons/icon-image-text-audio.png', 'assets/icons/icon-video.png', 'assets/icons/icon-video-text.png', 'assets/icons/icon-text.png', 'assets/icons/icon-text-audio.png', 'assets/icons/icon-audio.png', 'assets/icons/link_filled.png', 'assets/icons/room-pink.png', 'assets/icons/room.png', 'assets/icons/view-preview-accent.png', 'assets/icons/view-preview.png', 'assets/icons/view-toggle-2d-accent.png', 'assets/icons/view-toggle-2d.png', 'assets/icons/view-toggle-3d-accent.png', 'assets/icons/view-toggle-3d.png', 'assets/images/default-background.png', 'assets/images/color_ball.jpg'];
var resources = [defaultIndexPath, 'index.html', 'manifest.json', 'favicon.ico', 'polyfills.bundle.js', 'vendor.bundle.js', 'main.bundle.js'];
var cacheList = images.concat(resources);
exports.default = cacheList;

/***/ })
/******/ ]);
//# sourceMappingURL=0.map