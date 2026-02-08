const express = require('express');
const { ensureAuthenticatedStudent } = require('../../middleware/authMiddelware');
const upload = require('../../middleware/uploadMiddleware');
const { verifyStudent, submitPass, fetchDraft, getPassDetailsByPassID, EditPassDetails } = require('../../controllers/student_controllers/request_controller');

const router = express.Router();

router.post('/verify_student',ensureAuthenticatedStudent, verifyStudent);
router.post('/submit_pass', upload.single('file'), ensureAuthenticatedStudent, submitPass);
router.post('/fetch_drafts', ensureAuthenticatedStudent, fetchDraft);
router.post('/edit_student_pass', upload.single('file'), ensureAuthenticatedStudent, EditPassDetails);
router.post('/get_student_pass_by_passid', ensureAuthenticatedStudent, getPassDetailsByPassID);

module.exports = router;