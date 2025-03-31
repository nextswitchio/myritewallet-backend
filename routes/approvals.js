const router = require('express').Router();
const vfdController = require('../controllers/vfdController');
const { authenticate, isApprover } = require('../middlewares/auth');

router.post('/:caseId/approve', authenticate, isApprover, vfdController.approveCase);
router.post('/:caseId/reject', authenticate, isApprover, vfdController.rejectCase);
router.get('/pending', authenticate, isApprover, vfdController.getPendingCases);

module.exports = router;