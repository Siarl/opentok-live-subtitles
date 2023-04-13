const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));

// todo disable through envvar
//router.use('', require('./public'));
// router.use('/calls', require('./calls'));

module.exports = router;