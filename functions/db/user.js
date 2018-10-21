const functions = require("firebase-functions")
const admin = require("firebase-admin")
const crypto = require("crypto")
const config = require(`../config/${functions.config().project.env}.json`)
const mailTransport = require("../utils/mailer")
const getSettings = require("../utils/settings")
const functionsURL = config["functionsURL"]

module.exports = functions.auth.user().onCreate(user => {
  const activationToken = crypto.randomBytes(24).toString("hex")
  console.log('newdeploy')
  return admin
    .auth()
    .updateUser(user.uid, {
      disabled: true
    })
    .then(() => {
      return Promise.all([
        getSettings(),
        admin
          .firestore()
          .collection("users")
          .doc(user.uid)
          .set(
            {
              id: user.uid,
              email: user.email,
              activationToken
            },
            { merge: true }
          )
      ])
    })
    .then(([settings]) => {
      const activationUrl = `${functionsURL}/activate_user/${activationToken}`
      const mailer = mailTransport(settings.email)

      return mailer.sendMail(
        {
          from: "Social VR",
          to: settings.emailRecepients.join(","),
          subject: "New user registered",
          html: `User with email ${
            user.email
          } joined to SocialVR. Click <a target=_blank href='${activationUrl}'>here</a> to activate his account`
        },
        (error, info) => {
          console.log(error, info)
        }
      )
    })
})
