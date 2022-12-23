const express = require('express');
const router = express.Router();

router.use('/calls', require('./calls'));
router.use('', require('./public'));

module.exports = router;