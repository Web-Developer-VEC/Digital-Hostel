const {
  SendTextMessageCommand,
} = require("@aws-sdk/client-pinpoint-sms-voice-v2");

const { awsSmsClient } = require("../config/sms");

// ============================================
// TEST PHONE NUMBER
// ============================================

const phoneno = process.env.PHONE;

// ============================================
// COMMON SMS FUNCTION
// ============================================

const sendSMS = async (phoneNumber, message) => {
  try {
    // phoneNumber is accepted but ignored during testing
    console.log("Original destination:", phoneNumber);
    console.log("Testing destination:", phoneno);

    const command = new SendTextMessageCommand({
      // Always send to .env phone during testing
      DestinationPhoneNumber: phoneno,

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
 console.log("otp",otp);
 

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

  await sendSMS(parentPhoneNumber, smsMessage);

  return {
    success: true,
    message: "OTP sent successfully",
    pass_id,
  };
};

// ============================================
// STUDENT REACHED HOSTEL SMS
// ============================================

const sendParentReachedSMS = async (parentPhoneNumber, name, reachedTime) => {
  const smsMessage = `
VEC HOSTEL - Arrival Notification

Dear Parent,

Your ward ${name} has safely returned to the hostel.

Arrival Time: ${reachedTime}

Thank you,
Velammal Engineering College
`;

  return await sendSMS(parentPhoneNumber, smsMessage);
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
