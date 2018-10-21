const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { serviceAccount, databaseURL } = require(`./config/${functions.config().project.env}.json`)
const credential = admin.credential.cert(serviceAccount)

admin.initializeApp({ credential, databaseURL })

exports.user = require('./db/user')

exports.activate_user = require('./http/activate-user')