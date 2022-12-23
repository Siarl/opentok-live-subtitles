const speech = require('@google-cloud/speech');
const {STT_DEFAULT_ENCODING, STT_DEFAULT_SAMPLE_RATE, STT_DEFAULT_MODEL_CONFIG, STT_INTERIM_RESULTS} = require('../../stt-config')
const speechClient = new speech.SpeechClient();

const connectionHandler = (socket) => {
  console.log(`new socket connection from ${socket.handshake.address}`);

  let recognizeStream;

  socket.on('setup', (config) => {

    let sampleRate = config.sampleRate ?? STT_DEFAULT_SAMPLE_RATE;

    const request = {
      config: {
        encoding: STT_DEFAULT_ENCODING,
        sampleRateHertz: sampleRate,
        languageCode: STT_DEFAULT_MODEL_CONFIG.languageCode,
        model: STT_DEFAULT_MODEL_CONFIG.model,
        profanityFilter: STT_DEFAULT_MODEL_CONFIG.profanityFilter,
        enableAutomaticPunctuation: STT_DEFAULT_MODEL_CONFIG.enableAutomaticPunctuation,
      },
      interimResults: STT_INTERIM_RESULTS, // If you want interim results, set this to true
    };

    recognizeStream = speechClient
      .streamingRecognize(request)
      .on('end', () => {})
      .on('data', (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          let transcript = data.results[0].alternatives[0].transcript;
          let isFinal = data.results[0].isFinal;
          console.log(transcript);
          socket.emit('transcript', {isFinal, transcript})
        }
      })
      .once('error', (event) => {
        recognizeStream = null;
        console.error('error-event:', event);
      })
      .once('close', (event) => {
        recognizeStream = null;
        console.error('close-event:',event);
      })
      .once('finish', (event) => {
        recognizeStream = null;
        socket.emit()
        console.error('finish-event:',event);
      });

    socket.on('audio-data', (buffer) => {
      if (recognizeStream) {
        recognizeStream.write(buffer);
      }
    });
  });

  socket.on('disconnect', () => {
    if (recognizeStream) {
      recognizeStream.end();
    }
  });
};


module.exports = {
  connectionHandler
}