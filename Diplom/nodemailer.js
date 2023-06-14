import nodemailer from 'nodemailer'
import {google} from 'googleapis'
import config from './config.js'

const OAuth2 = google.auth.OAuth2,
      OAuth2_client = new OAuth2(config.clientId, config.clientSecret)

OAuth2_client.setCredentials({refresh_token: config.refreshToken})

function sendMail(recipient, subject, html) {
  const accessToken = OAuth2_client.getAccessToken(),
        transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: config.user,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken,
            accessToken: accessToken,
          }
        })
        
  transport.sendMail({
    from: 'Магазин Товарів <' + config.user + '>',
    to: recipient,
    subject: subject,
    html: html
  }, err => {
    if(err) console.log(err)
    transport.close()
  })
}

// sendMail('bodabodamops@gmail.com', 'Subject', 'TestText')

export default sendMail