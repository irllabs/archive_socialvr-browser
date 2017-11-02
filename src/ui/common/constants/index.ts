const build = require('build');

// api.socialvrlab.com => socialvr-production.cirjmyp4dr.us-east-1.elasticbeanstalk.com
// staging-api.socialvrlab.com => socialvr-staging.cirjmyp4dr.us-east-1.elasticbeanstalk.com
const environment = {
  LOCAL: 'http://127.0.0.1:8000',
  DEV: 'https://staging-api.socialvrlab.com',
  PROD: 'https://api.socialvrlab.com'
};
const baseUrl = environment[build] || environment.PROD;

export const BASE_URL: string = baseUrl;
export const POST_PROJECT_URL_PATH: string = '/socialVR/projects/';
export const GET_PROJECT_URL_PATH: string = '/socialVR/projects/';

export const ICON_PATH: string = 'assets/icons/';
export const IMAGE_PATH: string = 'assets/images/';
export const DEFAULT_FILE_NAME: string = '';
export const DEFAULT_IMAGE_PATH: string = `${IMAGE_PATH}default-background.png`;
export const DEFAULT_PROJECT_NAME: string = 'New Project';
export const DEFAULT_PROJECT_DESCRIPTION: string = 'A short description of the project';
export const DEFAULT_DOOR_NAME: string = 'Select ...';
export const BACKGROUND_THUMBNAIL = 'background_thumnbnail.jpg';

export const DEFAULT_VOLUME: number = 0.5;

export const ROOM_ICON_BUFFER_WIDTH: number = 40;  //half of room-icon-container-width in variables.scss
export const ROOM_ICON_BUFFER_HEIGHT: number = 24; //half of room-icon-size-large in variables.scss

export const MIME_TYPE_TEXT: string = 'text/plain';
export const MIME_TYPE_UTF8: string = 'text/plain;charset=utf-8';
export const MIME_TYPE_MP3: string = 'audio/mp3';
export const MIME_TYPE_WAV: string = 'audio/wav';
export const MIME_TYPE_AAC: string = 'audio/aac';
export const MIME_TYPE_XM4A: string = 'audio/x-m4a';
export const MIME_TYPE_MPEG: string = 'audio/mpeg';
export const MIME_TYPE_XWAV: string = 'audio/x-wav';
export const MIME_TYPE_PNG: string = 'image/png';
export const MIME_TYPE_JPG: string = 'image/jpg';
export const MIME_TYPE_JPEG: string = 'image/jpeg';
export const MIME_TYPE_ZIP: string = 'application/zip';
export const MIME_TYPE_X_ZIP: string = 'application/x-zip';
export const MIME_TYPE_OCTET_STREAM: string = 'application/octet-stream';
export const MIME_TYPE_X_ZIP_COMPRESSED: string = 'application/x-zip-compressed';
export const MIME_TYPE_MP4 = 'video/mp4';

export const UINT8ARRAY: string = 'uint8array';
export const STORY_FILE: string = 'story.yml';

export const GROUP_TYPE = {
  FEATURED: 'FEATURED',
  EXTERNAL: 'EXTERNAL'
};

// Copy
export const ERROR_OPENING_PROJECT = 'Error opening project';
export const FORMAT_ERROR = 'We had an issue trying to find that project. The link you tried may have been corrupted. Try using the original link again.';
export const SERVER_ERROR = 'We had an issue trying to open the project. It might not be available anymore.'


//THREE.js related
export const THREE_CONST = {
//Geometries
SPHERE_RADIUS: 512,
SPHERE_SLICES: 128,
RADIAL_DISTANCE: 10,
CAMERA_RETICLE: 148,
CAMERA_HOTSPOT: 150,
CAMERA_NAVPANEL: 200,
NAVPANEL_THETA: 130, //elevation, up and down
NAVPANEL_PHI: -90, //azimuth, around you on eye-level
NAVPANEL_OPACITY: 0.3,
NAVEPANEL_NEAR: 50,
NAVEBUTT_ACTIVE: 40,
HOTSPOT_DIM: 20,
DASHCIRCLE_SEG: 50,
HOME_BACK_DIM: 50,
HOTSPOT_NEAR: 30,
HOTSPOT_ACTIVE: 10,
NAVPANEL_W: 140,
NAVPANEL_H: 80,
POINTLIGHT_Z: 400,
RETICLE_INNER: 1,
RETICLE_OUTER: 2,
RETICLE_SEGS: 12,
RETICLE_BACK_RADIUS: 2,
FOV_NORM: 65,
FOV_IN: 20,
FOV_OUT: 110,
FONT_URL: 'https://fonts.googleapis.com/css?family=Nunito',
FONT_HOTSPOT_SIZE: 12,
FONT_HOTSPOT_HEIGHT: 3,
TEXTPLANE_WIDTH: 600,
TEXTPLANE_HEIGHT: 800,
TEXTPLANE_FONTSIZE: 26,
//Animations
HOTSPOT_MOD_FREQ: 0.005,
HOTSPOT_ROT_FREQ: 0.0005,
HOTSPOT_MOD_MAG: 0.01,
TWEEN_PLANE_IN: 1500,
TWEEN_PLANE_OUT: 500,
TWEEN_ICON_IN: 500,
TWEEN_ICON_OUT: 500,
TWEEN_PLANE_SCALE: 2,
TWEEN_ROOM_MOVE: 250,
TWEEN_ROOM_MOVEIN: 400,
TWEEN_ROOM_MOVETIMEOUT: 1500,
TWEEN_ROOM_MOVETIMEIN: 1500,

//Interaction
HOTSPOT_AUDIO_DELAY: 1000,
HOTSPOT_DOOR_DELAY: 1500

};
