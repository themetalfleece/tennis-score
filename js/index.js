$(document).ready(function () {

	// hide the Websocket menu if it's not loaded = the web app is static
	try {
		if (io === undefined);
	}
	catch (e) {
		$('.ws_only').hide();
	}

	var pointTrans;
	var matchState;
	var matchConfig;
	var backupMatchState;

	// websockets
	var socket;
	var match_id;

	pointTrans = [0, 15, 30, 40, "AD"];

	matchState = {
		points: [0, 0],
		tieBreakerActive: {},
		currentSet: 0,
		playerSetsWon: [0, 0],
		winner: -1,
		games: {},
		tieBreakerScore: {},
		latestEvent: { level: 0, text: "Match just started!" },
		wonSets: []
	}

	matchConfig = {
		gamesPerSet: 6,
		sets: 3,
		tieBreakerPoints: 7,
		players: ['Player 1', 'Player 2'],
	}


	for (matchState.games = []; matchState.games.push([0, 0]) <= 5;)
		;
	for (matchState.tieBreakerScore = []; matchState.tieBreakerScore.push([0, 0]) <= 5;)
		;


	restoreAppBackup();

	drawConfig();

	function backupApp() {
		window.localStorage.setItem('matchConfig', JSON.stringify(matchConfig));
		window.localStorage.setItem('matchState', JSON.stringify(matchState));
	}

	function restoreAppBackup() {
		var matchConfigGet = window.localStorage.getItem('matchConfig');
		var matchStateGet = window.localStorage.getItem('matchState');
		if (matchConfigGet === null || matchStateGet === null)
			;
		else {
			matchConfig = JSON.parse(matchConfigGet);
			matchState = JSON.parse(matchStateGet);
			drawConfig();
			drawScores();
		}
	};

	// TODO add who is serving

	$("#resetBtn").click(function () {

		$('#confirmResetModal').modal({ backdrop: 'static', keyboard: false })
			.one('click', '#confirmResetBtn', function () {
				matchState = {
					points: [0, 0],
					tieBreakerActive: {},
					currentSet: 0,
					playerSetsWon: [0, 0],
					winner: -1,
					games: {},
					tieBreakerScore: {},
					latestEvent: { level: 0, text: "Match just started!" },
					wonSets: []
				};
				for (matchState.games = []; matchState.games.push([0, 0]) <= 5;)
					;
				for (matchState.tieBreakerScore = []; matchState.tieBreakerScore.push([0, 0]) <= 5;)
					;
				$("#currentSet").val(1);

				$("#admin_p1pointsInput").val(0);
				$("#admin_p2pointsInput").val(0);
				for (var i = 1; i <= 5; i++) {
					for (var j = 1; j <= 2; j++) {
						$("#admin_p" + j + "set" + i + "Input").val(0);
						$('#p' + j + 'set' + i).removeClass('bold');
					}
				}
				$("#applyBtn").click();
			});

	});

	function processAdminValues() {
		// TODO change playerSetsWon etc and who is serving
	};


	function hideShowSets() {
		for (var i = 1; i <= matchConfig.sets; i++) {
			$("#set" + i + "head").removeClass('hidden');
			$("#admin_set" + i + "head").removeClass('hidden');
			for (var j = 1; j <= 2; j++) {
				$("#p" + j + "set" + i).removeClass('hidden');
				$("#admin_p" + j + "set" + i).removeClass('hidden');
			};

		}
		for (i = matchConfig.sets + 1; i <= 5; i++) {
			$("#set" + i + "head").addClass('hidden');
			$("#admin_set" + i + "head").addClass('hidden');
			for (var j = 1; j <= 2; j++) {
				$("#p" + j + "set" + i).addClass('hidden');
				$("#admin_p" + j + "set" + i).addClass('hidden');
			};
		}
	};

	function updateAdminInputs() {

		$("#admin_p1pointsInput").val(matchState.points[0]);
		$("#admin_p2pointsInput").val(matchState.points[1]);
		for (var i = 1; i <= matchConfig.sets; i++) {
			for (var j = 1; j <= 2; j++) {
				$("#admin_p" + j + "set" + i + "Input").val(matchState.games[i - 1][j - 1]);
			}
		}
	};


	$("#p1scoresBtn").click(function () {
		backup();
		playerScores(0);
		drawScores();
		$("#undoBtn").prop('disabled', false);
		backupApp();
	});

	$("#p2scoresBtn").click(function () {
		backup();
		playerScores(1);
		drawScores();
		$("#undoBtn").prop('disabled', false);
		backupApp();
	});

	$("#undoBtn").click(function () {
		restoreBackup();
		$(this).prop('disabled', true);
	});

	$("#adminBtn").click(function () {
		adminPanelToggle();
	});

	function adminPanelToggle() {
		$("#adminPanel").toggleClass('hidden');
		$("#adminBtn").toggleClass('btn-primary');
		if (!$("#adminPanel").hasClass('hidden')) {
			$("#sets").val(matchConfig.sets);
			$("#gamesPerSet").val(matchConfig.gamesPerSet);
			$("#tieBreakerPoints").val(matchConfig.tieBreakerPoints);
			$("#currentSet").val(parseInt(matchState.currentSet) + 1);
		}
		updateAdminInputs();
	};

	$("#applyBtn").click(function () {
		matchConfig.players[0] = $("#admin_p1nameInput").val();
		matchConfig.players[1] = $("#admin_p2nameInput").val();
		if (matchConfig.players[0] == "")
			matchConfig.players[0] = "Player 1";
		if (matchConfig.players[1] == "")
			matchConfig.players[1] = "Player 2";
		matchConfig.sets = parseInt($("#sets").val());
		matchConfig.gamesPerSet = parseInt($("#gamesPerSet").val());
		matchConfig.tieBreakerPoints = $("#tieBreakerPoints").val();
		matchState.currentSet = $("#currentSet").val() - 1;

		matchState.points[0] = $("#admin_p1pointsInput").val();
		matchState.points[1] = $("#admin_p2pointsInput").val();

		for (var i = 0; i < matchConfig.sets; i++) {
			matchState.games[i][0] = $("#admin_p1set" + parseInt(i + 1) + "Input").val();
			matchState.games[i][1] = $("#admin_p2set" + parseInt(i + 1) + "Input").val();
		}

		matchState.latestEvent.text = "";
		matchState.latestEvent.level = 0;

		$("#p1scoresBtn").prop('disabled', false);
		$("#p2scoresBtn").prop('disabled', false);
		$("#undoBtn").prop('disabled', true);


		backupApp();
		drawConfig();
		drawScores();
		adminPanelToggle();
		// emit the match config update
		emitMatchConfig();
		// emit the match state update
		emitMatchState();
	});

	function backup() {
		backupMatchState = jQuery.extend(true, {}, matchState);
	};

	function restoreBackup() {
		matchState = jQuery.extend(true, {}, backupMatchState);
		drawScores();
	};

	function drawScores() {
		drawPoints();
		var currentSetOld = matchState.currentSet;
		for (var i = 0; i < matchConfig.sets; i++) {
			matchState.currentSet = i;
			drawGamesInSet(i, matchState.tieBreakerActive[matchState.currentSet]);
			markSetRemove(i + 1);
		}
		matchState.currentSet = currentSetOld;
		if (matchState.winner == -1)
			markSetAdd(matchState.currentSet + 1);
		else
			drawWinner();
		for (var i = 0; i < matchState.wonSets.length; i++)
			$(matchState.wonSets[i]).addClass('bold');
		$('#latestEvent').text(matchState.latestEvent.text);
	};

	function drawPoints() {
		if (!matchState.tieBreakerActive[matchState.currentSet]) {
			fadeHtml('#p1points', pointTrans[matchState.points[0]]);
			fadeHtml('#p2points', pointTrans[matchState.points[1]]);
		}
		else {
			fadeHtml('#p1points', matchState.tieBreakerScore[matchState.currentSet][0]);
			fadeHtml('#p2points', matchState.tieBreakerScore[matchState.currentSet][1]);
		}
	}

	function drawGamesInSet(set, showTieBreakerScore) {
		fadeHtml('#p1set' + parseInt(set + 1), matchState.games[set][0] + (showTieBreakerScore ? "<sup>" + matchState.tieBreakerScore[matchState.currentSet][0] + "</sup>" : ""));
		fadeHtml('#p2set' + parseInt(set + 1), matchState.games[set][1] + (showTieBreakerScore ? "<sup>" + matchState.tieBreakerScore[matchState.currentSet][1] + "</sup>" : ""));
	}

	function drawWinner() {
		matchState.latestEvent.level = 4;
		matchState.latestEvent.text = matchConfig.players[matchState.winner] + " won the match!";
		$('#p1scoresBtn').prop('disabled', true);
		$('#p2scoresBtn').prop('disabled', true);
	}

	function markSetRemove(set) {
		$('#set' + set + 'head').removeClass('success');
	}
	function markSetAdd(set) {
		$('#set' + set + 'head').addClass('success');
	}

	function drawConfig() {
		hideShowSets();
		$('#p1name').text(matchConfig.players[0]);
		$('#p2name').text(matchConfig.players[1]);
		$("#p1scoresBtn").text(matchConfig.players[0]);
		$("#p2scoresBtn").text(matchConfig.players[1]);
	}

	function playerScores(winningPlayer) {

		matchState.latestEvent.level = 1;

		var losingPlayer = (winningPlayer + 1) % 2;

		if (matchState.tieBreakerActive[matchState.currentSet]) {
			matchState.tieBreakerScore[matchState.currentSet][winningPlayer]++;
			if (matchState.tieBreakerScore[matchState.currentSet][winningPlayer] >= matchConfig.tieBreakerPoints && matchState.tieBreakerScore[matchState.currentSet][winningPlayer] - matchState.tieBreakerScore[matchState.currentSet][losingPlayer] >= 2) {
				playerWinsSet(winningPlayer);
			}
		}
		else {
			// 0 to 30
			if (matchState.points[winningPlayer] <= 2)
				matchState.points[winningPlayer]++;
			// 40
			else if (matchState.points[winningPlayer] == 3) {
				// l = 40 - both had 40
				if (matchState.points[losingPlayer] == 3)
					matchState.points[winningPlayer]++;
				// l = AD
				else if (matchState.points[losingPlayer] == 4)
					matchState.points[losingPlayer]--;
				else
					playerWinsGame(winningPlayer);
			}
			// AD
			else if (matchState.points[winningPlayer] == 4)
				playerWinsGame(winningPlayer);
		}
		if (matchState.latestEvent.level <= 1)
			matchState.latestEvent.text = matchConfig.players[winningPlayer] + " scored the point";

		// transmit the match state
		emitMatchState();

	};

	function playerWinsGame(winningPlayer) {

		var losingPlayer = (winningPlayer + 1) % 2;

		matchState.points[0] = 0;
		matchState.points[1] = 0;

		matchState.games[matchState.currentSet][winningPlayer]++;

		if (matchState.games[matchState.currentSet][winningPlayer] >= matchConfig.gamesPerSet) {
			// oponent will have at least 2 games difference
			if (matchState.games[matchState.currentSet][winningPlayer] - matchState.games[matchState.currentSet][losingPlayer] >= 2)
				playerWinsSet(winningPlayer);
			else if (matchState.games[matchState.currentSet][winningPlayer] == matchConfig.gamesPerSet && matchState.games[matchState.currentSet][losingPlayer] == matchConfig.gamesPerSet)
				matchState.tieBreakerActive[matchState.currentSet] = true;
		}

		if (matchState.latestEvent.level <= 2) {
			matchState.latestEvent.level = 2;
			matchState.latestEvent.text = matchConfig.players[winningPlayer] + " won the game";
		}

	};

	function playerWinsSet(winningPlayer) {
		matchState.playerSetsWon[winningPlayer]++;
		matchState.wonSets.push("#p" + parseInt(winningPlayer + 1) + "set" + parseInt(matchState.currentSet + 1));
		if (matchState.playerSetsWon[winningPlayer] == (matchConfig.sets + 1) / 2) {
			matchState.winner = winningPlayer;
			return;
		};
		matchState.currentSet++;
		if (matchState.latestEvent.level <= 3) {
			matchState.latestEvent.level = 3;
			matchState.latestEvent.text = matchConfig.players[winningPlayer] + " took the set";
		}

	};

	/* methods for websockets */

	$('#host').click(function () {
		socket = io.connect('http://localhost:8080');

		// on connection to server, emit an addhost message
		socket.on('connect', function () {
			socket.emit('addhost');
			$('.connectionless_only').hide();
		});

		// it gets the id of the room it is hosting and emits config & state
		socket.on('basic_info', function (id) {
			match_id = id;
			$('#ws_status').html(`Broadcasting Match # ${match_id}<br>`);

			// after getting room id, we broadcast our config & state
			emitMatchConfig();
			emitMatchState();
		});

	});


	$('#join').click(function () {
		socket = io.connect('http://localhost:8080');

		match_id = parseInt(prompt('Which Match #?'));

		// when the match config needs to be updated
		socket.on('server_updates_config', function (config) {
			matchConfig = JSON.parse(config);
			drawConfig();
		});

		// when the match state needs to be updated
		socket.on('server_updates_state', function (state) {
			matchState = JSON.parse(state);
			drawScores();
		});

		// on connect, emite that we are listening the room specified
		socket.on('connect', function () {
			socket.emit('addlistener', match_id);
			$('#ws_status').html(`Spectating Match # ${match_id}<br>`);
			$('.connectionless_only').hide();
			$('.host_only').hide();
		});

	});

	function emitMatchState() {
		if (socket != undefined) {
			socket.emit('client_updates_state', match_id, JSON.stringify(matchState));
		}
	}

	function emitMatchConfig() {
		if (socket != undefined) {
			socket.emit('client_updates_config', match_id, JSON.stringify(matchConfig));
		}
	}

	/* End Of websockets */

	function fadeHtml(object, html) {
		if ($(object).html() != html) {
			$(object).fadeOut('fast', function () {
				$(this).html(html)
			}).fadeIn('fast');
		}
	}


});