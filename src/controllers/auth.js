const {createAuthToken, deleteAuthToken} = require("../services/auth");

exports.create = async (req, res) => {
  const secret = req.headers.authorization;
  const token = req.body.id;

  console.log(`create: ${secret} ${token}`);

  createAuthToken(secret, token).then((token) => {
    res.status(200).send(token);
  }, (error) => {
    if (error.code && error.message) {
      res.status(error.code).send(error.message);
    } else {
      res.sendStatus(500);
    }
  });
};

exports.delete = (req, res) => {
  const secret = req.headers.authorization;
  const token = req.body.id;

  deleteAuthToken(secret, token).then(() => {
    res.status(204).send();
  }, (error) => {
    if (error.code && error.message) {
      res.status(error.code).send(error.message);
    } else {
      res.sendStatus(500);
    }
  })
};
