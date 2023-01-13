const OPENTOK_KEY = process.env.OPENTOK_KEY;
const OPENTOK_SECRET = process.env.OPENTOK_SECRET;
const OT = require('opentok');
const opentok = new OT(OPENTOK_KEY, OPENTOK_SECRET);
const SECRET = process.env.DEMO_SECRET;
const authService = require('./auth');

let globalSession;

const createSession = () => new Promise((resolve, reject) => {
  opentok.createSession((error, session) => {
    if (error) reject(error);

    globalSession = session.sessionId;

    resolve(globalSession)
  });
});

const getToken = () => new Promise((resolve, reject) => {
  const sendToken = (sessionId) => {
    let token = opentok.generateToken(sessionId);

    authService.createAuthToken(SECRET, token).then((sttToken) => {
      resolve({
        apiKey: OPENTOK_KEY,
        token,
        sessionId,
        sttToken
      });
    }, (error) => {
      //todo handle error better
      reject(error);
    });

  }

  if (globalSession) {
    sendToken(globalSession);
  }
  else {
    createSession().then(sendToken, reject);
  }
});

module.exports = {
  getToken
}

