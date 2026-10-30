import nodemailer from "nodemailer"

// require("dotenv").config()

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        type:"OAuth2",
        user:process.env.GOOGLE_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    }
});

transporter.verify((error,success) => {
    if(error){
        console.error("Error connecting in email sender")
    }
    else{
        console.log("Email server is ready to send message")
    }
})


export const sendEmail = async(to,subject,text,html) => {
    try{
        const info = await transporter.sendMail({
            from: `Your Name <${process.env.GOOGLE_USER}>`,
            to,
            subject,
            text,
            html,
        });
    }
    catch(err){
        console.error("Error in sending mail",err)
    }
};

