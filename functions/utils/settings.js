const admin = require("firebase-admin")

module.exports = () => {
  return admin
    .firestore()
    .collection("settings")
    .doc("private")
    .get()
    .then(snapshot => snapshot.data())
}
