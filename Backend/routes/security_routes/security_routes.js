const express = require('express');
const { ensureAuthenticatedSecurity } = require('../../middleware/authMiddelware');
const { getPassDetails, passAccept, PassDecline } = require('../../controllers/security_controllers/security_controller');

const router = express.Router();

router.post('/fetch_pass_details', ensureAuthenticatedSecurity, getPassDetails);
router.post('/security_accept', ensureAuthenticatedSecurity, passAccept);
router.post('/security_decline', ensureAuthenticatedSecurity, PassDecline);

module.exports = router;