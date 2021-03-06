var cmdArgs = process.argv.splice(2),
	express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app).listen(/^\d+$/.test(cmdArgs[0]) ? cmdArgs[0] : 80),
	io = require('socket.io').listen(server),
	game = require('./server/game.js'),
	hasStarted = false,
	cluster = require('./server/cluster/handler.js'),
	compress = require('./lib/PikaCompress/compress.js');

io.set('log level', 2);
io.set('close timeout', 30);
io.set('heartbeat timeout', 30);
io.set('heartbeat interval', 15);

app.use(express.static(__dirname+'/client/html'));
app.use(express.static(__dirname+'/client/js'));
app.use(express.static(__dirname+'/client/blender'));
app.use(express.static(__dirname+'/client/img'));
app.use(express.static(__dirname+'/lib/pathfinding/lib'));
app.use(express.static(__dirname+'/lib/MicroCache'));
app.use(express.static(__dirname+'/lib/qunit'));
app.use(express.static(__dirname+'/client/lib/threejs/build'));
app.use(express.static(__dirname+'/lib/PikaCompress'));

io.sockets.on('connection', function(socket) {
	console.log("Got new connection "+socket.id+" from IP: "+socket.handshake.address.address);
	
	socket.on('newPlayer', function() {
		//game.newPlayer(socket, io);
		socket.emit("loadModels", game.requiredModels);
	});

	socket.on('loadedModels', function() {
		if(hasStarted)
			socket.emit('startGame');
		game.newPlayer(socket, io);
	});

	socket.on('clickPos', function(data) {
		if(hasStarted)
			game.clickPos(socket, io, data);
		else
			socket.emit('alert', "Game has not started yet!");
	});

	socket.on('selectedObj', function(data) {
		game.selectedObj(socket, io, data);
	});
	
	socket.on('eval', function(data) {
		io.sockets.emit('eval', data);
	});

	socket.on('createBuilding', function(data) {
		if(hasStarted)
			game.createBuilding(socket, data);
		else
			socket.emit('alert', "Game has not started yet!");
	});

	socket.on('nextClickBuild', function() {
		if(hasStarted)
			game.nextClickBuild(socket);
		else
			socket.emit('alert', "Game has not started yet!");
	});
	
	socket.on('disconnect', function() {
		console.log(socket.id+" has disconnected.");
		try {
			game.disconnected(socket, io);
		} catch (e) {
			console.warn("FATAL ERROR: "+e);
		}
	});
	socket.on('ping1', function() {
		socket.emit('pong1');
	});
	socket.on('ping2', function(data) {
		socket.emit('pong2', data);
	});
	socket.on('rep', function() {
		if(hasStarted)
			game.reproduce();
	});
});
updateSceneObjects();

game.events.once('startGame', function() {
	setTimeout(function(){
		game.startSpawningZombies(io);
		setInterval(function(){game.attackCheck(io);}, 5000);
	}, 60000); // Grace period
	setInterval(game.reproduce, 15000);
	setInterval(game.minionGatherTeam, 7500);
	updateScoreboard();
	hasStarted = true;
	io.sockets.emit('startGame');
	console.log('Started game!');
});

function updateSceneObjects() {
	var objsToSend = [];
	for(var i in game.objects) {
		if(game.objects.hasOwnProperty(i)) {
			for(var j in game.objects[i].Characters.Minions) {
				if(game.objects[i].Characters.Minions.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Minions[j]);
				}
			}
			for(var j in game.objects[i].Characters.Commanders) {
				if(game.objects[i].Characters.Commanders.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Commanders[j]);
				}
			}
			for(var j in game.objects[i].Characters.Hero) {
				if(game.objects[i].Characters.Hero.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].Characters.Hero[j]);
				}
			}
			for(var j in game.objects[i].buildings) {
				if(game.objects[i].buildings.hasOwnProperty(j)) {
					objsToSend.push(game.objects[i].buildings[j]);
				}
			}
		}
	}
	for(var i in game.zombies) {
		if(game.zombies.hasOwnProperty(i)) {
			objsToSend.push(game.zombies[i]);
		}
	}
	//io.sockets.emit('updateObjects', objsToSend);
	var output = [];
	for(var i=0; i<objsToSend.length;i++) {
		output.push(objsToSend[i].uid);
		output.push(objsToSend[i].pos.x);
		output.push(objsToSend[i].pos.y);
		output.push(objsToSend[i].pos.z);
		output.push(objsToSend[i].scale.x);
		output.push(objsToSend[i].scale.y);
		output.push(objsToSend[i].scale.z);
		output.push(objsToSend[i].targetPos.x);
		output.push(objsToSend[i].targetPos.y);
		output.push(objsToSend[i].targetPos.z);
		output.push(objsToSend[i].health);
		output.push(objsToSend[i].maxHealth);
		output.push(objsToSend[i].speed);
		output.push(objsToSend[i].owner != undefined ? game.objects[objsToSend[i].owner].PlayerID + 1 : 255);
		output.push(objsToSend[i].objectType);
	}
	output = compress.encodeArray(output, true, false);
	//console.log("Output: "+output);
	io.sockets.emit('uObj', output);
		//io.sockets.emit('movePlayer', {name: objects[socket.id].name, model: objects[socket.id].model, pos: objects[socket.id].pos})
	setTimeout(updateSceneObjects, 100);
}

function updateScoreboard() {
	var scores = {};
	var output = [];
	for(var i in game.objects) {
		if(game.objects.hasOwnProperty(i)) {
			var i1 = game.objects[i];
			scores[i] = {
				Hero: i1.Characters.Hero.length(),
				Commanders: i1.Characters.Commanders.length(),
				Minions: i1.Characters.Minions.length(),
				Buildings: i1.buildings.length(),
				Inventory: {
					Food: i1.inventory.food,
					Building: i1.inventory.building
				}
			};
			output.push(scores[i].Hero);
			output.push(scores[i].Commanders);
			output.push(scores[i].Minions);
			output.push(scores[i].Buildings);
			output.push(scores[i].Inventory.Food);
			output.push(scores[i].Inventory.Building);
			output.push(i1.PlayerID + 1);
		}
	}
	output = compress.encodeArray(output, true, false);
	io.sockets.emit('uSB', output);
	//io.sockets.emit('updateScoreboard', scores);
	setTimeout(updateScoreboard, 500);
}

game.events.on('cluster', function(data) {
	cluster.taskWorker(data.cmd, data.params);
});

cluster.events.on('deleteNav', function(data) {
	game.objects[data.socketid].Characters[data.objectType][data.objectName].navData = [];
});
cluster.events.on('setupNavData', function(data) {
	var object = game.objects[data.socketid].Characters[data.objectType][data.objectName];
	if(typeof(object) == "undefined") {
		game.stopMoveTimer(data.timerID);
		return;
	}
	//object.grid = data.grid;
	//object.finder = data.finder;
	object.navData = data.navData;
	//game.startMoveTimer(data.socketid, data.objectType, data.objectName);
});
cluster.events.on('updateObject', function(data) {
	var object = game.objects[data.socketid].Characters[data.objectType][data.objectName];
	if(typeof(object) == "undefined") {
		game.stopMoveTimer(data.timerID);
		return;
	}
	object.pos = data.objectPos;
	object.navData = data.navData;
});
cluster.events.on('stopMoveTimer', function(data) {
	game.stopMoveTimer(data.timerID);
});
cluster.events.on('deleteZombieNav', function(data) {
	game.zombies[data.objectName].navData = [];
});
cluster.events.on('updateZombieObject', function(data) {
	var object = game.zombies[data.objectName];
	if(typeof(object) == "undefined") {
		game.stopMoveTimer(data.timerID);
		return;
	}
	object.pos = data.objectPos;
	object.navData = data.navData;
});
cluster.events.on('setTargetPos', function(data) {
	var object = game.objects[data.socketid].Characters[data.objectType][data.objectName];
	object.targetPos = data.targetPos;
});