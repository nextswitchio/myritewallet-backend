const router = require('express').Router();
const templateController = require('../controllers/templateController');
const { authenticate } = require('../middlewares/auth');

router.post('/', authenticate, templateController.createTemplate);
router.get('/', authenticate, templateController.getTemplates);
router.post('/:id/execute', authenticate, templateController.executeTemplate);

module.exports = router;