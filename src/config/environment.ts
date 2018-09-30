const build = require('build');

const firebase = build === 'PROD' ? {
  apiKey: 'AIzaSyC5Q5Ie9To_fE2Yk8jOq1BCjIlV-9SEqQM',
  authDomain: 'social-vr-161302.firebaseapp.com',
  databaseURL: 'https://social-vr-161302.firebaseio.com',
  projectId: 'social-vr-161302',
  storageBucket: 'social-vr-161302.appspot.com',
  messagingSenderId: '613942124685',
  dynamicLinkDomain: 'svrst.page.link'
  
} : {
  apiKey: 'AIzaSyAYEF9C8sje4GzAYoKJVO9dhXNSp_k31mw',
  authDomain: 'social-vr-staging-52b75.firebaseapp.com',
  databaseURL: 'https://social-vr-staging-52b75.firebaseio.com',
  projectId: 'social-vr-staging-52b75',
  storageBucket: 'social-vr-staging-52b75.appspot.com',
  messagingSenderId: '415514108134',
  dynamicLinkDomain: 'svrst.page.link'
};

export const ENV = {
  firebase,

  firebaseStore: {
    timestampsInSnapshots: true,
  },
};
