const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require(`./service_accounts/${functions.config().project.env}.json`);

const databases = {
  "default": "https://social-vr-staging-52b75.firebaseio.com"
}
const options = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databases[functions.config().project.env]
};

admin.initializeApp(options)


exports.user = require('./db/user')

exports.activate_user = require('./http/activate-user')