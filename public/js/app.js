/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let apiKey;
let sessionId;
let otToken;
let sttToken;
let session;
let publisher;
let socket;
let audioContext;
let lin16Processor;
let agcProcessor;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
  session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function streamCreated(event) {
    const subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    session.subscribe(event.stream, 'subscriber', subscriberOptions, handleError);
  });

  session.on('sessionDisconnected', function sessionDisconnected(event) {
    console.log('You were disconnected from the session.', event.reason);
  });

  session.on('signal:subtitle', (event) => {
    if (session.connection && event.from.connectionId !== session.connection.id) {
      // Signal received from another client
      let {isFinal, transcript} = JSON.parse(event.data);
      console.log(`signal: ${isFinal} ${transcript}`);
      let lastSubtitleEl = document.querySelector('.otherSubtitle.last')
      lastSubtitleEl.innerHTML = transcript;
      subContainer.scrollTop = subContainer.scrollHeight;

      if (isFinal) {
        lastSubtitleEl.classList.remove('last');
        const node = document.createElement('p');
        node.classList.add('otherSubtitle', 'last');
        subContainer.appendChild(node)
      }
    }
  });

  // initialize the publisher
  var publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  };
  publisher = OT.initPublisher('publisher', publisherOptions, handleError);

  // Connect to the session
  session.connect(otToken, function callback(error) {
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      session.publish(publisher, handleError);
    }
  });
}

function toggleSubtitles(turnOn) {
  console.log(`enable subs: ${turnOn}`);
  if (turnOn) {
    return streamPublisherAudioToSocket()
  } else if (socket) {
    socket.close();
    audioContext.close();
    lin16Processor.port.close();
    lin16Processor = null;
    agcProcessor = null;
    socket = null;
    audioContext = null;
  }

  return new Promise(function (resolve) {
    resolve(true)
  })
}

function streamPublisherAudioToSocket() {
  return new Promise(function (resolve, reject) {
    const audioTrack = publisher.getAudioSource();
    audioContext = new window.AudioContext();

    console.log(audioTrack.getConstraints());
    audioTrack.applyConstraints({
      autoGainControl: true
    }).then(() => {
      const mediaStream = new MediaStream([audioTrack]);

      Promise.all([
        // audioContext.audioWorklet.addModule('js/agc-processor.js'),
        audioContext.audioWorklet.addModule('js/lin16-processor.js'),
      ]).then(() => {
        // agcProcessor = new AudioWorkletNode(audioContext, 'agc-processor', {
        //   outputChannelCount: [1]
        // });

        lin16Processor = new AudioWorkletNode(audioContext, 'lin16-processor', {
          outputChannelCount: [1]
        });

        const source = audioContext.createMediaStreamSource(mediaStream);
        // source.connect(agcProcessor)
        // agcProcessor.connect(lin16Processor)
        source.connect(lin16Processor);

        socket = io();
        socket.emit('setup', {
          session: otToken,
          auth: sttToken,
          sampleRate: audioContext.sampleRate,
        });

        lin16Processor.port.onmessage = event => {
          socket.emit('audio-data', event.data);
        }
        lin16Processor.port.start()

        socket.on('end', (_) => {
          let lastSubtitleEl = document.querySelector('.ownSubtitle.last')
          lastSubtitleEl.classList.remove('last');

          const message = document.createElement('p');
          message.innerHTML = 'Subtitles ended. Enable again to continue.'
          message.classList.add('subtitleEnded');
          subContainer.appendChild(message);

          subContainer.scrollTop = subContainer.scrollHeight;

          const nextSubtitleEl = document.createElement('p');
          nextSubtitleEl.classList.add('ownSubtitle', 'last');
          subContainer.appendChild(nextSubtitleEl);
        })

        socket.on('transcript', ({isFinal, transcript}) => {
          console.log(`tr: ${isFinal} ${transcript}`);

          let lastSubtitleEl = document.querySelector('.ownSubtitle.last')
          lastSubtitleEl.innerHTML = transcript;
          subContainer.scrollTop = subContainer.scrollHeight;

          if (isFinal) {
            lastSubtitleEl.classList.remove('last');
            const node = document.createElement('p');
            node.classList.add('ownSubtitle', 'last');
            subContainer.appendChild(node)
          }

          session.signal({
            type: 'subtitle',
            data: JSON.stringify({isFinal, transcript})
          })
        })

        resolve(true);
      }, (error) => {
        console.log('could not connect', error)
        resolve(false)
      });
    });

  });
}

/*
init
 */

let subContainer = document.getElementById('subtitles');
const otherSubtitle = document.createElement('p');
otherSubtitle.classList.add('otherSubtitle', 'last');
subContainer.appendChild(otherSubtitle)

const ownSubtitle = document.createElement('p');
ownSubtitle.classList.add('ownSubtitle', 'last');
subContainer.appendChild(ownSubtitle)

let toggle = document.getElementById('subtitleToggle');
toggle.checked = false
toggle.addEventListener('change', function () {
  toggleSubtitles(this.checked);
}, false);

fetch(`${window.location.protocol}//${window.location.host}/calls`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
}).then(function fetch(res) {
  return res.json();
}).then(function fetchJson(json) {
  apiKey = json.apiKey;
  sessionId = json.sessionId;
  otToken = json.token;
  sttToken = json.sttToken;

  initializeSession();
}).catch(function catchErr(error) {
  handleError(error);
  alert('Failed to get opentok sessionId and token.');
});


