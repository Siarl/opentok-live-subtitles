const {randString} = require("../helpers/util");
const SECRETS = [process.env.DEMO_SECRET]
const TTL_SECONDS = process.env.SESSION_TTL;

const otTokenAuthMap = new Map();

const createAuthToken = (secret, otToken) => new Promise((resolve, reject) => {

  if (!SECRETS.includes(secret)) {
    reject({code: 401, message: 'Unauthorized'});
  }


  if (otTokenAuthMap.has(otToken)) {
    reject({code: 409, message: 'Already exists.'});
  }

  const token = randString(16);

  let expireDate = new Date();
  expireDate.setSeconds(expireDate.getSeconds() + TTL_SECONDS);

  otTokenAuthMap.set(otToken, {
    expireDate,
    token
  });

  resolve(token);

});

const deleteAuthToken = (secret, otToken) => new Promise((resolve, reject) => {
  if (!SECRETS.includes(secret)) {
    reject({code: 401, message: 'Unauthorized'});
  }

  if (otTokenAuthMap.has(otToken)) {
    otTokenAuthMap.delete(otToken);
  }

  resolve();
});

const validateAuthToken = (otToken, sttToken) => new Promise((resolve, reject) => {
  if (!otTokenAuthMap.has(otToken)) {
    reject('Does not exist.');
  }

  // todo validate args => not null, not empty

  const authEntry = otTokenAuthMap.get(otToken);

  if (authEntry && authEntry.expireDate && authEntry.expireDate > Date.now()) {
    if (authEntry.token && authEntry.token === sttToken) {
      resolve();
    } else {
      reject('Invalid token.');
    }
  } else {
    otTokenAuthMap.delete(otToken);
    reject('Expired token.');
  }
});

module.exports = {
  deleteAuthToken,
  createAuthToken,
  validateAuthToken
}