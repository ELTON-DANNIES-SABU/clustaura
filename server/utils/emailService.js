const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
    // Note: For Gmail, you usually need an "App Password" if 2FA is enabled
    // The user should set these in their .env file
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-gmail@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });

    const mailOptions = {
        from: `"ClustAura" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP - ClustAura',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #339933; text-align: center;">ClustAura</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please use the following 6-digit One-Time Password (OTP) to proceed:</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    ${otp}
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777; text-align: center;">
                    © 2024 ClustAura Technologies, Inc.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Still log the OTP in console for dev if email fails
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        return false;
    }
};

module.exports = { sendOTPEmail };
