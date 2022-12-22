const fs = require('fs');

module.exports = (path) => {
  const googleCreds = process.env.GOOGLE_CREDS;
  if (!googleCreds) {
    throw new Error('The GOOGLE_CREDS environment variable was not found!');
  }

  const keyPath = path + '/google-key';
  fs.writeFileSync(keyPath, googleCreds);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}
