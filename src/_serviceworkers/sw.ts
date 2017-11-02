import cacheList from './cache-list';
import {ICON_PATH} from 'ui/common/constants';

const swVersion = '001'; // TODO: generate dynamically
const CACHE_NAME = `svr-sw-${swVersion}`;
const whitelist = ['localhost', 'localhost:3000', 'cmuartfab.github.io/social-vr'];

function stringContains(str, list) {
  return list.some(pattern => str.indexOf(pattern) > -1);
}

// TODO: add service worker types
self.addEventListener('install', $event => {
  (<any>$event).waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(cacheList))
      .catch(error => console.log('error', error))
  );
});

self.addEventListener('fetch', $event => {
  const request = (<any>$event).request;
  if (!stringContains(request.url, whitelist)) {
    return;
  }
  (<any>$event).respondWith(
    caches.match((<any>$event).request)
      .then(response => response ? response : fetch(request))
      .catch(error => console.log('fetch error', error))
  );
});
