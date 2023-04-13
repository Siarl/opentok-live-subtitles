const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/:id', authController.create);
router.delete('/:id', authController.delete);

module.exports = router;