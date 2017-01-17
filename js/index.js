$(document).ready(function(){

		// standard variables
		var pointTrans = [0, 15, 30, 40, "AD"];

		var matchState = {
			points : [0, 0],
			tieBreakerActive : [],
			currentSet : 0,
			playerWonSets : [0, 0],
			winner : -1,
			games: [],
			tieBreakerScore: [],
			latestEvent : {level:0, text:"Match just started!"},
		}

		var backupMatchState;

		// user specified variables
		var matchConfig = {
			gamesPerSet: 3,
			sets: 3,
			tieBreakerPoints: 7,
			players : ['Player 1', 'Player 2'],
		}

		$('#p1name').text(matchConfig.players[0]);
		$('#p2name').text(matchConfig.players[1]);
		$("#p1scoresBtn").text(matchConfig.players[0] + " scores");
		$("#p2scoresBtn").text(matchConfig.players[1] + " scores");

		for (matchState.games=[]; matchState.games.push([0,0])<matchConfig.sets;)
			;
		for (matchState.tieBreakerScore=[]; matchState.tieBreakerScore.push([0,0])<matchConfig.sets;)
			;


		$("#p1scoresBtn").click(function(){
			backup();
			playerScores(0);
			drawScores();
			$("#undoBtn").prop('disabled', false);
		});

		$("#p2scoresBtn").click(function(){
			backup();
			playerScores(1);
			drawScores();
			$("#undoBtn").prop('disabled', false);
		});

		$("#undoBtn").click(function(){
			restoreBackup();
			$(this).prop('disabled', true);
		});

		function backup() {
			backupMatchState =  jQuery.extend(true, {}, matchState);
		};

		function restoreBackup() {
			matchState =  jQuery.extend(true, {}, backupMatchState);
			drawScores();
		};

		function drawScores() {
			drawPoints();
			var currentSetOld = matchState.currentSet;
			for (var i=0; i<matchConfig.sets;i++){
				matchState.currentSet = i;
				drawGamesInSet(i, matchState.tieBreakerActive[matchState.currentSet]);
				markSetRemove(i+1);
			}
			matchState.currentSet = currentSetOld;
			if (matchState.winner == -1)
				markSetAdd(matchState.currentSet+1);
			else
				drawWinner();
			$('#latestEvent').text(matchState.latestEvent.text);
		};

		function drawPoints() {
			if (!matchState.tieBreakerActive[matchState.currentSet]){
				fadeHtml('#p1points', pointTrans[matchState.points[0]]);
				fadeHtml('#p2points', pointTrans[matchState.points[1]]);
			}
			else {
				fadeHtml('#p1points', matchState.tieBreakerScore[matchState.currentSet][0]);
				fadeHtml('#p2points', matchState.tieBreakerScore[matchState.currentSet][1]);
			}
		}

		function drawGamesInSet(set, showTieBreakerScore){
			fadeHtml('#p1set'+ parseInt(set+1), matchState.games[set][0]+(showTieBreakerScore?"<sup>"+matchState.tieBreakerScore[matchState.currentSet][0]+"</sup>":""));
			fadeHtml('#p2set'+ parseInt(set+1), matchState.games[set][1]+(showTieBreakerScore?"<sup>"+matchState.tieBreakerScore[matchState.currentSet][1]+"</sup>":""));
		}

		function drawWinner() {
			matchState.latestEvent.level = 4;
			matchState.latestEvent.text = matchConfig.players[matchState.winner] + " won the match!";
			$('#p1scoresBtn').prop('disabled', true);
			$('#p2scoresBtn').prop('disabled', true);
		}

		function markSetRemove(set) {
			$('#set'+set+'head').removeClass('success');
		}
		function markSetAdd(set) {
			$('#set'+set+'head').addClass('success');
		}

		function playerScores(winningPlayer){

			matchState.latestEvent.level = 1;

			var losingPlayer = (winningPlayer+1)%2;

			if (matchState.tieBreakerActive[matchState.currentSet]){
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
				else if (matchState.points[winningPlayer] == 3){
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
				matchState.latestEvent.text = matchConfig.players[winningPlayer] + " scores the point";
		};

		function playerWinsGame(winningPlayer){

			var losingPlayer = (winningPlayer+1)%2;

			matchState.points[0]=0;
			matchState.points[1]=0;

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
				matchState.latestEvent.text = matchConfig.players[winningPlayer] + " wins the game";
			}

		};

		function playerWinsSet(winningPlayer){
			matchState.playerWonSets[winningPlayer]++;
			if (matchState.playerWonSets[winningPlayer] == (matchConfig.sets+1)/2){
				matchState.winner = winningPlayer;
				return;
			}
			matchState.currentSet++;
			if (matchState.latestEvent.level <= 3) {
				matchState.latestEvent.level = 3;
				matchState.latestEvent.text = matchConfig.players[winningPlayer] + " takes the set";
			}
		};


		function fadeHtml(object, html){
			if ($(object).html() != html) {
				$(object).fadeOut('fast',function() {
					$(this).html(html)
				}).fadeIn('fast');
			}
		}

	});