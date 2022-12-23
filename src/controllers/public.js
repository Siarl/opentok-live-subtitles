const express = require('express');

const staticMiddleware = express.static(__dirname + '/../../public', {extensions: ['html']});
const envUsername = process.env.USERNAME ?? 'user';
const envPassword = process.env.PASSWORD ?? 'password';

module.exports = (req, res, next) => {
  const reject = () => {
    res.setHeader("www-authenticate", "Basic");
    res.sendStatus(401);
  }

  const authorization = req.headers.authorization;

  if (!authorization) {
    return reject();
  }

  const [username, password] = Buffer.from(
    authorization.replace("Basic ", ""),
    "base64"
  ).toString().split(":");

  if (!(username === envUsername && password === envPassword)) {
    return reject();
  }

  staticMiddleware(req, res, next);
};
