const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.rambler.ru',
  port: 465 ,
  secure: true, // true just for port 465
  auth: {
      user: 'magazin.tovarovv@rambler.ru',
      pass: '123aA456'
  }
})

transporter.sendMail({
  from: 'Магазин Товаров magazin.tovarovv@rambler.ru',
  to: 'bodabodamops@gmail.com',
  subject: 'Hey from node.js',
  text: 'Test'
}, (err, info) => {
  if(err) {
    console.log(err)
    return
  }

  console.log(info)
})