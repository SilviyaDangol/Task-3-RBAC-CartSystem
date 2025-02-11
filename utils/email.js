const nodemailer = require('nodemailer');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// SMTP configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// email content
const sendResetEmail = async (email, token) => {
    const resetUrl = `http://localhost:${PORT}/auth/reset-password/${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `Click <a href="${resetUrl}">here</a> to reset your password. Link valid for 15 minutes.`
    });
};
module.exports =  { sendResetEmail };
// const testAccount = await nodemailer.createTestAccount();
// console.log(testAccount);