const speech = require('@google-cloud/speech');
const {Writable} = require('stream');
const speechClient = new speech.SpeechClient();
const {STT_DEFAULT_ENCODING, STT_DEFAULT_SAMPLE_RATE, STT_DEFAULT_MODEL_CONFIG, STT_INTERIM_RESULTS} = require('../../stt-config')
const streamingLimit = 30000; // in ms

const foospeechCallback = (callback) => data => {
  if (data.results[0] && data.results[0].alternatives[0]) {
    let transcript = data.results[0].alternatives[0].transcript;
    let isFinal = data.results[0].isFinal;
    console.log(transcript);
    callback(isFinal, transcript);
  }
};

module.exports = (config, callback) => {

  /// get stt request values from config
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

  /// setup vars
  let recognizeStream = null;
  let restartCounter = 0;
  let audioInput = [];
  let lastAudioInput = [];
  let resultEndTime = 0;
  let isFinalEndTime = 0;
  let finalRequestEndTime = 0;
  let newStream = true;
  let bridgingOffset = 0;
  let lastTranscriptWasFinal = false;
  let timeout = null;

  /// create input stream
  const audioInputStreamTransform = new Writable({
    write(chunk, encoding, next) {
      // check if the stt request stream is new and if there is lastAudioInput
      if (newStream && lastAudioInput.length !== 0) {
        // Approximate math to calculate time of chunks
        const chunkTime = streamingLimit / lastAudioInput.length;
        if (chunkTime !== 0) {
          if (bridgingOffset < 0) {
            bridgingOffset = 0;
          }
          if (bridgingOffset > finalRequestEndTime) {
            bridgingOffset = finalRequestEndTime;
          }
          const chunksFromMS = Math.floor(
            (finalRequestEndTime - bridgingOffset) / chunkTime
          );
          bridgingOffset = Math.floor(
            (lastAudioInput.length - chunksFromMS) * chunkTime
          );

          for (let i = chunksFromMS; i < lastAudioInput.length; i++) {
            recognizeStream.write(lastAudioInput[i]);
          }
        }
        newStream = false;
      }

      audioInput.push(chunk);

      if (recognizeStream) {
        recognizeStream.write(chunk);
      }

      next();
    },

  });
  audioInputStreamTransform.on('close', () => {
    console.log('closing audioInputStreamTransform');
    if (recognizeStream) {
      recognizeStream.end();
    }
    if (timeout) {
      clearTimeout(timeout);
    }
  })

  const speechCallback = stream => {
    // Convert API result end time from seconds + nanoseconds to milliseconds
    resultEndTime =
      stream.results[0].resultEndTime.seconds * 1000 +
      Math.round(stream.results[0].resultEndTime.nanos / 1000000);

    // Calculate correct time based on offset from audio sent twice
    const correctedTime =
      resultEndTime - bridgingOffset + streamingLimit * restartCounter;


    if (stream.results[0].isFinal) {
      isFinalEndTime = resultEndTime;
      lastTranscriptWasFinal = true;
    } else {
      lastTranscriptWasFinal = false;
    }

    ////

    if (stream.results[0] && stream.results[0].alternatives[0]) {
      let transcript = stream.results[0].alternatives[0].transcript;
      let isFinal = stream.results[0].isFinal;
      console.log(transcript);
      callback(isFinal, transcript);
    }
  };

  /// method to start stream to stt service
  const startStream = () => {

    // clear audio input
    audioInput = [];

    recognizeStream = speechClient
      .streamingRecognize(request)
      .on('data', speechCallback)
      .on('error', err => {
        if (err.code === 11) {
          console.log('Restart early due to no audio.');
          restartStream();
        } else {
          console.error('API request error ' + err);
        }
      })

    // Restart stream when streamingLimit expires
    timeout = setTimeout(restartStream, streamingLimit);
  }

  /// method to create new stream to stt service
  const restartStream = () => {
    console.log('restartStream!');
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream.removeListener('data', speechCallback);
      recognizeStream = null;
    }
    if (resultEndTime > 0) {
      finalRequestEndTime = isFinalEndTime;
    }
    resultEndTime = 0;

    lastAudioInput = [];
    lastAudioInput = audioInput;

    restartCounter++;

    if (!lastTranscriptWasFinal) {
      process.stdout.write('\n');
    }

    newStream = true;

    startStream();
  }

  /// create first request
  startStream();

  /// return input stream
  return audioInputStreamTransform;
}