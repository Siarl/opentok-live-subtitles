const speech = require('@google-cloud/speech');
const fs = require('fs');
const {STT_DEFAULT_ENCODING, STT_DEFAULT_SAMPLE_RATE, STT_DEFAULT_MODEL_CONFIG, STT_INTERIM_RESULTS} = require('../../stt-config')
const speechClient = new speech.SpeechClient();
const {validateAuthToken} = require('../services/auth.js');
const stt = require('../services/stt');

const connectionHandler = (socket) => {

  let recognizeStream;
  const writeStream = fs.createWriteStream('./recording.wav');

  socket.on('setup', (req) => {

    let sttToken = req.auth;
    let otToken = req.session;

    validateAuthToken(otToken, sttToken).then(() => {

      recognizeStream = stt(req, (isFinal, transcript) => {
        socket.emit('transcript', {isFinal, transcript});
      });

      socket.on('audio-data', (buffer) => {
        if (recognizeStream) {
          recognizeStream.write(buffer);
        }
        if (writeStream) {
          writeStream.write(buffer);
        }
      });
    }, (error) => {
      socket.disconnect();
    });
  });

  socket.on('disconnect', () => {
    if (recognizeStream) {
      recognizeStream.destroy();
    }
    if (writeStream) {
      writeStream.destroy();
    }
  });
};


module.exports = {
  connectionHandler
}