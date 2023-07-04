const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 8080;

server.listen(port);
console.log(`Listening on :${port}`);

// routing
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use("/js", express.static("js"));
app.use("/css", express.static("css"));

// users which are currently listening
const listeners = {};

// rooms which are currently available in chat
const rooms = {};
let room_count = 1;

io.sockets.on("connection", function (socket) {
  socket.on("addhost", function () {
    rooms[room_count] = {};
    rooms[room_count].host = socket.handshake.headers.cookie;
    // emit the room id. also, request its current state & config
    socket.emit("basic_info", room_count);
    console.log(`room ${room_count} added`);
    // TODO find a smarter way rather than ++
    room_count++;
  });

  function isHost(id, cookie) {
    try {
      if (rooms[id].host === cookie) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  socket.on("client_updates_state", function (id, state) {
    if (isHost(id, socket.handshake.headers.cookie)) {
      rooms[id].state = state;
      socket.broadcast.to(id).emit("server_updates_state", state);
    }
  });

  socket.on("client_updates_config", function (id, config) {
    if (isHost(id, socket.handshake.headers.cookie)) {
      rooms[id].config = config;
      socket.broadcast.to(id).emit("server_updates_config", config);
    }
  });

  // when a new client listens to a room
  socket.on("addlistener", function (id) {
    socket.room = id;
    socket.join(id);

    try {
      socket.emit("server_updates_config", rooms[id].config);
      socket.emit("server_updates_state", rooms[id].state);
    } catch (e) {}
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function () {
    // TODO inform listeners if host has left
    socket.leave(socket.room);
  });
});
