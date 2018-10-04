const functions = require('firebase-functions')
const nodemailer = require('nodemailer')

module.exports = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.user,
    pass: functions.config().gmail.pass,
  },
})