const fs = require('fs');

exports.createJwt = (rootDir) => {
  const googleCreds = process.env.GOOGLE_CREDS;
  if (!googleCreds) {
    throw new Error('The GOOGLE_CREDS environment variable was not found!');
  }

  const keyPath = rootDir + '/.google-key';
  fs.writeFileSync(keyPath, googleCreds);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

exports.deleteJwt = (rootDir) => {
  fs.unlinkSync(rootDir + '/.google-key');
}