const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/', authController.create);
router.delete('/', authController.delete);

module.exports = router;