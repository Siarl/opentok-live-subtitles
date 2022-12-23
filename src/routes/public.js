const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public');

router.use(publicController);

module.exports = router;