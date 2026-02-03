const express = require('express');
const { ensureAuthenticatedSuperior } = require('../../middleware/authMiddelware');
const { profileChangeRequestSuperior, profileUpdate, getVacateFormRequest, confirmVacate } = require('../../controllers/superior_controllers/request_controller');

const router = express.Router();

router.get('/profile_request_changes', ensureAuthenticatedSuperior, profileChangeRequestSuperior);
router.post('/handle_request', ensureAuthenticatedSuperior, profileUpdate);
router.get('/get_all_vacate_forms', ensureAuthenticatedSuperior, getVacateFormRequest);
router.post('/archive_student', ensureAuthenticatedSuperior, confirmVacate);

module.exports = router;