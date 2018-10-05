const functions = require("firebase-functions")
const admin = require("firebase-admin")
const nodemailer = require("nodemailer")

module.exports = ({ user, pass }) => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  })
}
