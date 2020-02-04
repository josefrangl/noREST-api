const nodemailer = require('nodemailer');

const sendMail = async (name, email, newPassword) => {
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
    from: 'noRest@noRest.com',
    to: email,
    subject: 'noRest: Reset Forgotten Password',
    text: `Hi ${name[0].toUpperCase() + name.slice(1)}! 
    
    It seems that you've forgotten your password. No worries, we've reset it for you - the next time you login please use the following password:

    ${newPassword}

    Don't worry, you can change your password once you login!

    Have a great day!

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
            Hi ${name[0].toUpperCase() + name.slice(1)}!
            <br>
            <br>
            It seems that you've forgotten your password. No worries, we've reset it for you - the next time you login please use the following password:
            <br>
            <br>
            <span>${newPassword}</span>
            <br>
            <br>
            Don't worry, you can change it once you login!
            <br>
            <br>
            Have a good day!
            <br>
            <br>
            The noRest Team ☁️
          </p>
        </div>
      </div>
    `
  };

  const sent = await transporter.sendMail(mail);

  return sent;

};

module.exports = sendMail;