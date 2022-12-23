/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let apiKey;
let sessionId;
let token;
let session;
let publisher;
let socket;
let audioContext;
let sttProcessor;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
  session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', function streamCreated(event) {
    var subscriberOptions = {
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
  session.connect(token, function callback(error) {
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
    sttProcessor.port.close();
    sttProcessor = null;
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
    const mediaStream = new MediaStream([audioTrack]);

    audioContext = new window.AudioContext();

    audioContext.audioWorklet.addModule('js/stt-processor.js').then((res) => {
      sttProcessor = new AudioWorkletNode(audioContext, 'stt-processor', {
        outputChannelCount: [1]
      })

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(sttProcessor)

      console.log(`sampleRate: ${audioContext.sampleRate}`);

      socket = io();
      socket.emit('setup', {
        sampleRate: audioContext.sampleRate,
      });
      sttProcessor.port.onmessage = event => socket.emit('audio-data', event.data)
      sttProcessor.port.start()

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
  token = json.token;

  initializeSession();
}).catch(function catchErr(error) {
  handleError(error);
  alert('Failed to get opentok sessionId and token.');
});


