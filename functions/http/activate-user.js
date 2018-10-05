const functions = require("firebase-functions")
const admin = require("firebase-admin")
const getSettings = require("../utils/settings")
const mailTransport = require("../utils/mailer")

const app = require("express")()

app.get("/:token", (req, res) => {
  const { token } = req.params
  return admin
    .firestore()
    .collection("users")
    .where("activationToken", "==", token)
    .get()
    .then(({ docs }) => {
      const [user] = docs
      if (!user) {
        throw new Error("User not found")
      }
      return Promise.all([
        getSettings(),
        user.data(),
        admin.auth().updateUser(user.id, {
          disabled: false
        })
      ])
    })
    .then(([settings, user]) => {
      const mailer = mailTransport(settings.email)
      mailer.sendMail(
        {
          from: "Social VR",
          to: user.email,
          subject: "Your account is activated",
          html: `Congratulations, you account is successfully activated. You can login now.`
        },
        (error, info) => {
          console.log(error, info)
        }
      )
      return res.send("User successfully activated")
    })
    .catch(err => {
      return res.send(err)
    })
})

module.exports = functions.https.onRequest(app)
