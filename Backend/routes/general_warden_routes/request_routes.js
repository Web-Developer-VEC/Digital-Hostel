const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { foodChangeApprove, getFoodRequestChange,  } = require('../../controllers/warden_controllers/request_controller');
const { fetchPassWarden, WardenDecision } = require('../../controllers/general_warden_controllers/request_general_controller');

const router = express.Router();

router.get('/food_requests_changes', ensureAuthenticatedWarden, getFoodRequestChange);
router.post('/approve_food_change', ensureAuthenticatedWarden, foodChangeApprove);
router.get('/fetch_passes_', ensureAuthenticatedWarden, fetchPassWarden);
router.post('/warden_decision', ensureAuthenticatedWarden, WardenDecision);

module.exports = router;