const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server)
const port = 3000;

app.use(express.static('public'));

server.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
})