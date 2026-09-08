const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { getWardenProfile } = require('../../controllers/general_warden_controllers/getWardernProfile');

const router = express.Router();

router.get('/warden_profile', ensureAuthenticatedWarden, getWardenProfile);

module.exports = router;