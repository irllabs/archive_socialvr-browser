const pathName = location.pathname;
const defaultIndexPath = pathName.substring(0, pathName.lastIndexOf('sw.js'));

const images = [
  'assets/icons/icon-audio.png',
  'assets/icons/back_filled.png',
  'assets/icons/icon-doorhotspot.png',
  'assets/icons/home_filled.png',
  'assets/icons/home.png',
  'assets/icons/icon-hotspot-default.png',
  'assets/icons/icon-hotspot-hover.png',
  'assets/icons/icon-add.png',
  'assets/icons/icon-home.png',
  'assets/icons/icon-image.png',
  'assets/icons/icon-image-text.png',
  'assets/icons/icon-image-audio.png',
  'assets/icons/icon-image-text-audio.png',
  'assets/icons/icon-video.png',
  'assets/icons/icon-video-text.png',
  'assets/icons/icon-text.png',
  'assets/icons/icon-text-audio.png',
  'assets/icons/icon-audio.png',
  'assets/icons/link_filled.png',
  'assets/icons/room-pink.png',
  'assets/icons/room.png',
  'assets/icons/view-preview-accent.png',
  'assets/icons/view-preview.png',
  'assets/icons/view-toggle-2d-accent.png',
  'assets/icons/view-toggle-2d.png',
  'assets/icons/view-toggle-3d-accent.png',
  'assets/icons/view-toggle-3d.png',
  'assets/images/default-background.png',
  'assets/images/color_ball.jpg'
];

const resources = [
  defaultIndexPath,
  'index.html',
  'manifest.json',
  'favicon.ico',
  'polyfills.bundle.js',
  'vendor.bundle.js',
  'main.bundle.js'
];

const cacheList = images.concat(resources);
export default cacheList;
