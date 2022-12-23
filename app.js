const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const io = new Server(server);
const port = process.env.PORT ?? 3000;
const { createJwt, deleteJwt } = require('./src/helpers/googleAuth');
const mainRouter = require('./src/routes');

async function main() {
  createJwt(__dirname);

  server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });

  const speechClient = new SpeechClient();

  // The path to the remote LINEAR16 file
  const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    uri: gcsUri,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await speechClient.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);

}

// app.use(express.static('public'));
app.use('/', mainRouter);

process.on('SIGINT', shutdown);

function shutdown() {
  console.log('shutting down server...');
  deleteJwt(__dirname);
  server.close(function () {
    console.log('server closed');
  });
}

main().catch(console.error);
