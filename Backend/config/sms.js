const {
    PinpointSMSVoiceV2Client
} = require("@aws-sdk/client-pinpoint-sms-voice-v2");

const awsSmsClient = new PinpointSMSVoiceV2Client({
    region: process.env.AWS_REGION,

    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

module.exports = {
    awsSmsClient
};