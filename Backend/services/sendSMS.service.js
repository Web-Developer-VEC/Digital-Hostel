const {
  SendTextMessageCommand,
} = require("@aws-sdk/client-pinpoint-sms-voice-v2");

const { awsSmsClient } = require("../config/sms");

// ============================================
// TEST PHONE NUMBER
// ============================================

function formatIndianPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return null;
    }

    // Convert to string and remove spaces, -, (, ), etc.
    let number = String(phoneNumber).replace(/\D/g, "");

    // Remove leading 0
    if (number.startsWith("0")) {
        number = number.substring(1);
    }

    // If already has 91 and total length is 12
    if (number.startsWith("91") && number.length === 12) {
        return `+${number}`;
    }

    // Normal Indian 10-digit mobile number
    if (number.length === 10) {
        return `+91${number}`;
    }

    return null;
}


const sendSMS = async (phone_number_parent, message) => {
  try {
    const phoneNumber = formatIndianPhoneNumber(phone_number_parent);
    // phoneNumber is accepted but ignored during testing
    console.log("Original destination:", phoneNumber);
    console.log("Testing destination:", phoneNumber);

    const command = new SendTextMessageCommand({
      // Always send to .env phone during testing
      DestinationPhoneNumber: phoneNumber,

      MessageBody: message,

      MessageType: "TRANSACTIONAL",
    });

    const response = await awsSmsClient.send(command);

    console.log("✅ SMS sent successfully");
    console.log("Message ID:", response.MessageId);

    return response;
  } catch (error) {
    console.error("❌ SMS Error:", error);

    throw new Error(error.Reason || error.message || "Failed to send SMS");
  }
};

// ============================================
// PARENT APPROVAL SMS
// ============================================

const sendParentApprovalSMS = async (
  parentPhoneNumber,
  name,
  place_to_visit,
  reason_for_visit,
  from,
  to,
  otp
) => {
    const phoneNumber = formatIndianPhoneNumber(parentPhoneNumber);
 

  const smsMessage = `
VEC HOSTEL - Pass Approval

Student: ${name}

Place: ${place_to_visit}

Reason: ${reason_for_visit}

Duration:
${from} to ${to}

Your verification OTP: ${otp}

Use this OTP to approve or reject the pass request.
OTP expires in 5 minutes.
Do not share this OTP with anyone.
`;

  await sendSMS(phoneNumber, smsMessage);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};

// ============================================
// STUDENT REACHED HOSTEL SMS
// ============================================

const sendParentReachedSMS = async (parentPhoneNumber, name, reachedTime) => {

      const phoneNumber = formatIndianPhoneNumber(parentPhoneNumber);


  const smsMessage = `
VEC HOSTEL - Arrival Notification

Dear Parent,

Your ward ${name} has safely returned to the hostel.

Arrival Time: ${reachedTime}

Thank you,
Velammal Engineering College
`;

  return await sendSMS(phoneNumber, smsMessage);
};

// ============================================
// FORGOT PASSWORD OTP
// ============================================

const sendOTPForForgetPassword = async (warden_number, name, req) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  console.log("OTP:", otp);

  // Store OTP in session
  req.session.otp = String(otp);

  // OTP expires after 5 minutes
  req.session.otpExpires = Date.now() + 5 * 60 * 1000;

  const smsMessage = `
VEC HOSTEL

Dear ${name},

Your password reset OTP is:

${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

Velammal Engineering College
`;

  await sendSMS(warden_number, smsMessage);

  console.log(`✅ OTP sent successfully to ${name}`);

  return otp;
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  sendSMS,

  sendOTPForForgetPassword,

  sendParentApprovalSMS,

  sendParentReachedSMS,
};
