// Example using Twilio - swap for MSG91/Fast2SMS if preferred
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSms(phone, message) {
    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${phone}` // adjust country code as needed
    });
}

module.exports = { sendSms };