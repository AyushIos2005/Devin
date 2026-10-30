export function generateOtp() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function getOtpHtml(otp) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>OTP Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:10px; text-align:center;">
            <h2 style="color:#333;">Email Verification</h2>

            <p>Your One-Time Password (OTP) is:</p>

            <h1 style="letter-spacing:5px; color:#2563eb;">
                ${otp}
            </h1>

            <p>This OTP is valid for <strong>10 minutes</strong>.</p>

            <p>If you didn't request this OTP, you can safely ignore this email.</p>

            <hr>

            <small>
                © 2026 Your App. All Rights Reserved.
            </small>
        </div>
    </body>
    </html>
    `;
}

// module.exports = {
//     generateOtp,
//     getOtpHtml
// };