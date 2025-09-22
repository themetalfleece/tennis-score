const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 3000;

server.listen(port);
console.log(`Listening on http://localhost:${port}`);

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
const usedRoomIds = new Set();
const roomIdQueue = [];
let queueIndex = 0;

// Initialize array with all possible 4-digit room IDs (1000-9999)
for (let i = 1000; i <= 9999; i++) {
  roomIdQueue.push(i);
}

// Shuffle the array to randomize the order
for (let i = roomIdQueue.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [roomIdQueue[i], roomIdQueue[j]] = [roomIdQueue[j], roomIdQueue[i]];
}

// Function to get the next available room ID
function generateRoomId() {
  // If all room IDs are currently in use, cycle through the queue
  if (usedRoomIds.size >= 9000) {
    // Find the oldest room ID that's no longer active
    const startIndex = queueIndex;
    while (usedRoomIds.has(roomIdQueue[queueIndex])) {
      queueIndex = (queueIndex + 1) % roomIdQueue.length;
      // Exit condition: if we've checked all room IDs and they're all used
      if (queueIndex === startIndex) {
        console.log("All room IDs are in use, defaulting to 1000");
        return 9999; // Default fallback
      }
    }
    const roomId = roomIdQueue[queueIndex];
    usedRoomIds.add(roomId);
    queueIndex = (queueIndex + 1) % roomIdQueue.length;
    return roomId;
  }

  // Find the next unused room ID from the shuffled queue
  let roomId;
  do {
    roomId = roomIdQueue[queueIndex];
    queueIndex = (queueIndex + 1) % roomIdQueue.length;
  } while (usedRoomIds.has(roomId));

  usedRoomIds.add(roomId);
  return roomId;
}

io.sockets.on("connection", function (socket) {
  socket.on("addhost", function () {
    const roomId = generateRoomId();
    rooms[roomId] = {};
    rooms[roomId].host = socket.handshake.headers.cookie;
    // emit the room id. also, request its current state & config
    socket.emit("basic_info", roomId);
    console.log(`room ${roomId} added`);
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
    } catch (e) { }
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function () {
    // TODO inform listeners if host has left
    socket.leave(socket.room);

    // Clean up room if host disconnects
    if (socket.room && rooms[socket.room] && rooms[socket.room].host === socket.handshake.headers.cookie) {
      console.log(`room ${socket.room} removed (host disconnected)`);
      delete rooms[socket.room];
      usedRoomIds.delete(socket.room);
    }
  });
});
