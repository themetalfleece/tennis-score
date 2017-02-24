var express = require('express')
	, app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server);

server.listen(8080);
console.log('Listening on :8080');

// routing
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

// users which are currently listening
var listeners = {};

// rooms which are currently available in chat
var rooms = {};
var room_count = 0;

io.sockets.on('connection', function (socket) {

	socket.on('addhost', function () {
		rooms[room_count] = {};
		rooms[room_count].host = socket.handshake.headers.cookie;
		// emit the room id. also, request its current state & config
		socket.emit('basic_info', room_count);
		// TODO find a smarter way rather than ++
		room_count++;
	});

	function isHost(id, cookie) {
		try {
			if (rooms[id].host === cookie)
				return true;
			return false;
		} catch (e) {
			return false;
		}
	}

	socket.on('client_updates_state', function (id, state) {
		if (isHost(id, socket.handshake.headers.cookie)) {
			rooms[id].state = state;
			socket.broadcast.to(id).emit('server_updates_state', state);
		}
	});

	socket.on('client_updates_config', function (id, config) {
		if (isHost(id, socket.handshake.headers.cookie)) {
			rooms[id].config = config;
			socket.broadcast.to(id).emit('server_updates_config', config);
		}
	});

	// when a new client listens to a room
	socket.on('addlistener', function (id) {
		socket.room = id;
		socket.join(id);

		try {
			socket.emit('server_updates_config', rooms[id].config);
			socket.emit('server_updates_state', rooms[id].state);
		} catch (e) { }
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		// TODO inform listeners if host has left
		socket.leave(socket.room);
	});
});
