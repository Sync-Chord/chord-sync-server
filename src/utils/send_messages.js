//module imports
import twilio from "twilio";
import nodemailer from "nodemailer";

//twillio setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

//nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

export const send_message_to_phone = (to, message) => {
  return client.messages.create({
    to: to,
    body: message,
    messagingServiceSid: process.env.TWILLIO_MESSAGING_SERVICE_ID,
  });
};

export const send_email = (emails, subject, message) => {
  const mail_options = {
    from: process.env.EMAIL,
    to: emails,
    subject: subject,
    text: message,
  };

  return transporter.sendMail(mail_options);
};
