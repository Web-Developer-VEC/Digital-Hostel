const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { foodChangeApprove, getFoodRequestChange,  } = require('../../controllers/warden_controllers/request_controller');
const { fetchPassWarden, WardenDecision, parentApproval, verifyParentOTP, sendParentApprovalOTP } = require('../../controllers/general_warden_controllers/request_general_controller');

const router = express.Router();

router.get('/food_requests_changes', ensureAuthenticatedWarden, getFoodRequestChange);
router.post('/approve_food_change', ensureAuthenticatedWarden, foodChangeApprove);
router.get('/fetch_passes_', ensureAuthenticatedWarden, fetchPassWarden);
router.post('/warden_decision', ensureAuthenticatedWarden, WardenDecision);
router.post('/send_parent_otp', ensureAuthenticatedWarden, sendParentApprovalOTP);
router.post('/verify_parent_otp', ensureAuthenticatedWarden, verifyParentOTP);

module.exports = router;