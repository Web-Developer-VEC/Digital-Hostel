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

function formatDateTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\bam\b|\bpm\b/g, (period) => period.toUpperCase());
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
  otp,
) => {
  const phoneNumber = formatIndianPhoneNumber(parentPhoneNumber);

  const smsMessage = `
VEC HOSTEL

Pass Approval

Student: ${name}
Place: ${place_to_visit}
Reason: ${reason_for_visit}
Duration: ${formatDateTime(from)} to ${formatDateTime(to)}

Your verification OTP is ${otp}. Use this OTP to approve or reject the pass request. This OTP expires in 5 minutes. Do not share this OTP with anyone.

வேலம்மாள் பொறியியல் கல்லூரி விடுதி

பாஸ் அனுமதி

மாணவர்: ${name}
செல்லும் இடம்: ${place_to_visit}
காரணம்: ${reason_for_visit}
கால அளவு: ${formatDateTime(from)} முதல் ${formatDateTime(to)} வரை

உங்கள் சரிபார்ப்பு OTP: ${otp}. பாஸ் கோரிக்கையை ஏற்க அல்லது நிராகரிக்க இந்த OTP-ஐ பயன்படுத்தவும். இந்த OTP 5 நிமிடங்களில் காலாவதியாகும். இந்த OTP-ஐ யாரிடமும் பகிர வேண்டாம்.
`;

  await sendSMS(phoneNumber, smsMessage);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};

// ============================================
// STUDENT EXIT SMS
// ============================================

const sendParentExitSMS = async (parentPhoneNumber, name, exitTime) => {
  const phoneNumber = formatIndianPhoneNumber(parentPhoneNumber);

  const smsMessage = `
VEC HOSTEL

Departure Notification

Student: ${name}
Exit Time: ${formatDateTime(exitTime)}

Dear Parent,

Your ward ${name} has left the hostel.

Thank you,
Velammal Engineering College

வேலம்மாள் பொறியியல் கல்லூரி விடுதி

வெளியேறும் அறிவிப்பு

மாணவர்: ${name}
வெளியேறிய நேரம்: ${formatDateTime(exitTime)}

அன்புள்ள பெற்றோருக்கு,

உங்கள் வார்டு ${name} விடுதியை விட்டு வெளியேறியுள்ளார்.

நன்றி,
வேலம்மாள் பொறியியல் கல்லூரி
`;

  return await sendSMS(phoneNumber, smsMessage);
};

// ============================================
// STUDENT REACHED HOSTEL SMS
// ============================================

const sendParentReachedSMS = async (parentPhoneNumber, name, reachedTime) => {
  const phoneNumber = formatIndianPhoneNumber(parentPhoneNumber);

  const smsMessage = `
VEC HOSTEL

Arrival Notification

Student: ${name}
Arrival Time: ${formatDateTime(reachedTime)}

Dear Parent,

Your ward ${name} has safely returned to the hostel.

Thank you,
Velammal Engineering College

வேலம்மாள் பொறியியல் கல்லூரி விடுதி

வருகை அறிவிப்பு

மாணவர்: ${name}
திரும்பிய நேரம்: ${formatDateTime(reachedTime)}

அன்புள்ள பெற்றோருக்கு,

உங்கள் வார்டு ${name} பாதுகாப்பாக விடுதிக்கு திரும்பியுள்ளார்.

நன்றி,
வேலம்மாள் பொறியியல் கல்லூரி
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

Dear: ${name}

Password Reset OTP:

${otp}

This OTP is valid for 5 minutes. Do not share this OTP with anyone.

வேலம்மாள் பொறியியல் கல்லூரி விடுதி

அன்புள்ள: ${name}

கடவுச்சொல் மீட்டமைப்பு OTP:

${otp}

இந்த OTP 5 நிமிடங்களுக்கு செல்லுபடியாகும். இந்த OTP-ஐ யாரிடமும் பகிர வேண்டாம்.

வேலம்மாள் பொறியியல் கல்லூரி
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

  sendParentExitSMS,

  sendParentReachedSMS,
};
