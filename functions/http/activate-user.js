const functions = require("firebase-functions")
const admin = require("firebase-admin")

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
      return admin.auth().updateUser(user.id, {
        disabled: false
      })
    })
    .then(() => {
      return res.send("User successfully activated")
    })
    .catch(err => {
      return res.send(err)
    })
})

module.exports = functions.https.onRequest(app)
