const nodemailer = require('nodemailer');

const sendMail = async (name, email) => {
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    },
    sendmail: true
  });

  const mail = {
    from: "noRest@noRest.com",
    to: email,
    subject: 'noRest: Account Confirmation',
    text: `Hi ${name}! 
    
    Thanks for registering with noRest! To confirm your account and create your first API just click here.

    Have a good day!

    The noRest team :)
    `,
    html: `
      <div style="width: 100%">
        <div style="text-align: center">
          <img src="https://no-rest.s3.eu-west-3.amazonaws.com/no-rest-logo-lowercase_300x100.png" alt="NoRest logo"/>
          <br>
          <p style="border-top: 1px solid #dbd5d5; font-family: Helvetica; color: #495160; font-size: 1.5em"> 
            <br>
            <br>
            Hi ${name}!
            <br>
            <br>
            Thanks for registering with <a href="http://localhost:3000">noRest</a>.
            <br>
            <br> 
            To confirm your account and create your first API just <a href="http://localhost:3000/webapp/confirmation/${email}">click here</a>.
            <br>
            <br>
            Have a good day!
            <br>
            <br>
            The noRest team ☁️
          <p>
        </div>
      </div>
    `
  };

  const sent = await transporter.sendMail(mail);

  return sent;

}

module.exports = sendMail;

// const sent = await transporter.sendMail(mail);

