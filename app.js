const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = process.env.PORT ?? 3000;
const { createJwt, deleteJwt } = require('./src/helpers/googleAuth');
const { connectionHandler } = require('./src/sockets');
const mainRouter = require('./src/routes');

async function main() {
  createJwt(__dirname);

  server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });

}

// app.use(express.static('public'));
app.use('/', mainRouter);

io.on('connected', connectionHandler);

process.on('SIGINT', shutdown);

function shutdown() {
  console.log('shutting down server...');
  deleteJwt(__dirname);
  server.close(function () {
    console.log('server closed');
  });
}

main().catch(console.error);
