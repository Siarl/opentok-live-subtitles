const callService = require('../services/calls');

exports.getSession = (req, res) => {
  callService.getToken().then(body => {
    res.status(201).send(body);
  }, error => {
    console.error(error);
    res.status(501).send(error);
  });
};
