const express = require('express');
const router = express.Router();
const callsController = require('../controllers/calls');

router.get('/', callsController.getSession)

module.exports = router;