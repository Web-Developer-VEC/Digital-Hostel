const express = require('express');
const { ensureAuthenticatedSecurity } = require('../../middleware/authMiddelware');
const { getPassDetails, passAccept } = require('../../controllers/security_controllers/security_controller');

const router = express.Router();

router.post('/fetch_pass_details', ensureAuthenticatedSecurity, getPassDetails);
router.post('/security_accept', ensureAuthenticatedSecurity, passAccept)

module.exports = router;