var modelLookupTable = {
	1: "HumanBase",
	2: "HumanBase",
	3: "HumanBase",
	4: "zombie",
	5: "RTS-Barracks1"
};
socket.on('connect', function() {
	//if(playerName == "")playerName = "Player "+Math.floor(Math.random()*100);
	//socket.emit('newPlayer', {name:playerName, model:"HumanBase"});
	socket.emit('newPlayer');
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyDown, false );
});
socket.on('loadModels', function(models) {
	console.log(models);
	addObj("terrain","level1.js",function(a){
		a.scale.x=2.125;
		a.scale.y=2.125;
		//a.scale.y=0.1;
		a.scale.z=2.125;
		a.position.x=-4.5;
		a.position.z=-4.5;
		loadModel(models, 0);
	});
	document.getElementById("percentLoaded").innerText=Math.round(1/(models.length+1)*100);
});
socket.on('isPlaying', function(playing) {
	gameUpdate();
	isPlaying = playing;
	if(isPlaying == 0)
		alert("There are already 2 players, so you may only spectate!");
	if(isPlaying == 2) {
		camera.position = new THREE.Vector3(64,15,105);
		pointLight.position = new THREE.Vector3(-125,75,-125);
		camera.rotateY(180*(Math.PI/180));
		cameraMin = -10;
		cameraMax = 115;
	}
	camera.rotateOnAxis(new THREE.Vector3(-1.75,0.5,0), 30*(Math.PI/180));

});
function loadModel(models, i) {
	console.log((i+1)+" of "+models.length+" loaded");
	loader.load(models[i]+".js", function(geometry, mats) {
		modelCache.set(models[i]+".js", {geometry: geometry, mats:mats});
		document.getElementById("percentLoaded").innerText=Math.round((i+2)/(models.length+1)*100);
		if(i>models.length-2)
			setupNetwork();
		else
			loadModel(models, i+1);
	});
}
function setupNetwork() {
	socket.on('uObj', function(data) {
		var arr = decodeArray(data);
		//console.log(arr);
		var data = [];
		var unitData = [];
		for(var i=0; i<arr.length/15; i++) {
			data[i] = [];
			for(var j=0; j<15; j++) {
				data[i][j] = arr[i*15+j];
			}
			unitData[i] = {
				uid: data[i][0],
				pos: {x: data[i][1], y: data[i][2], z: data[i][3]},
				scale: {x: data[i][4], y: data[i][5], z: data[i][6]},
				targetPos: {x: data[i][7], y: data[i][8], z: data[i][9]},
				health: data[i][10],
				maxHealth: data[i][11],
				speed: data[i][12],
				owner: data[i][13],
				objectType: data[i][14]
			};
			if(objects.hasOwnProperty(unitData[i].uid)) {
				if(objects[unitData[i].uid].position.distanceTo(unitData[i].pos) > 4) {
					objects[unitData[i].uid].position = new THREE.Vector3(unitData[i].pos.x, unitData[i].pos.y, unitData[i].pos.z);
				}
				try {
					if(unitData[i].objectType != 5) {
						objects[unitData[i].uid].targetPosition = new THREE.Vector3(unitData[i].targetPos.x, unitData[i].targetPos.y, unitData[i].targetPos.z);
						objects[unitData[i].uid].speed = unitData[i].speed;
					}
				} catch(e) {}
				objects[unitData[i].uid].scale = new THREE.Vector3(unitData[i].scale.x,unitData[i].scale.y,unitData[i].scale.z);
				objects[unitData[i].uid].owner = unitData[i].owner;
				objects[unitData[i].uid].health = unitData[i].health;
				objects[unitData[i].uid].maxHealth = unitData[i].maxHealth;
				objects[unitData[i].uid].objectType = unitData[i].objectType;
				if(objects[unitData[i].uid].owner == isPlaying) {
					objects[unitData[i].uid].material.materials[0].color.r = (objects[unitData[i].uid].maxHealth - objects[unitData[i].uid].health < objects[unitData[i].uid].maxHealth / 2) ? (objects[unitData[i].uid].maxHealth - objects[unitData[i].uid].health) / objects[unitData[i].uid].maxHealth * 0.8 : 0.4;
					objects[unitData[i].uid].material.materials[0].color.g = (objects[unitData[i].uid].health < objects[unitData[i].uid].maxHealth / 2) ? objects[unitData[i].uid].health / objects[unitData[i].uid].maxHealth * 0.8 : 0.4;
					if(selectedObj != objects[unitData[i].uid])
						objects[unitData[i].uid].material.materials[0].color.b = 0;
					else
						objects[unitData[i].uid].material.materials[0].color.b = 0.4;
				}
			} else {
				addPlayer(unitData[i].uid, modelLookupTable[unitData[i].objectType], unitData[i].pos, unitData[i].scale, unitData[i].objectType);
				//console.log("Added "+data[i].name);
			}
		}
		var currObjs = new Object();
	    for (var attr in objects) {
	        if (objects.hasOwnProperty(attr)) currObjs[attr] = objects[attr];
	    }
		delete currObjs.terrain;
		for(var i in unitData) {
			if(currObjs.hasOwnProperty(unitData[i].uid))
				delete currObjs[unitData[i].uid];
		}
		for(var i in currObjs) {
			remObj(i);
			//console.log("Removed "+i);
		}
		//console.log(data);
	});
	socket.on('updateObjects', function(data) {
		//console.log("Recieved updateObjects!");
		//console.log(data);
		for(var i in data) {
			if(objects.hasOwnProperty(data[i].name)) {
				//objects[data[i].name].position = new THREE.Vector3(data[i].pos.x,data[i].pos.y,data[i].pos.z); if(new THREE.Raycaster(new THREE.Vector3(objects[data[i].name].position.x,1000,objects[data[i].name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain).length != 0) objects[data[i].name].position.y = 1000-new THREE.Raycaster(new THREE.Vector3(objects[data[i].name].position.x,1000,objects[data[i].name].position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
				if(objects[data[i].name].position.distanceTo(data[i].pos) > 4) {
					objects[data[i].name].position = new THREE.Vector3(data[i].pos.x,data[i].pos.y,data[i].pos.z);
				}
				try {
					objects[data[i].name].targetPosition = new THREE.Vector3(data[i].targetPos.x, data[i].targetPos.y, data[i].targetPos.z);
					objects[data[i].name].speed = data[i].speed;
				} catch(e) {}
				objects[data[i].name].scale = new THREE.Vector3(data[i].scale.x,data[i].scale.y,data[i].scale.z);
				objects[data[i].name].owner = (data[i].hasOwnProperty("owner")) ? data[i].owner : null;
				objects[data[i].name].health = (data[i].hasOwnProperty("health")) ? data[i].health : null;
				objects[data[i].name].maxHealth = (data[i].hasOwnProperty("maxHealth")) ? data[i].maxHealth : null;
				if(objects[data[i].name].owner == socket.socket.sessionid) {
					objects[data[i].name].material.materials[0].color.r = (objects[data[i].name].maxHealth - objects[data[i].name].health < objects[data[i].name].maxHealth / 2) ? (objects[data[i].name].maxHealth - objects[data[i].name].health) / objects[data[i].name].maxHealth * 0.8 : 0.4;
					objects[data[i].name].material.materials[0].color.g = (objects[data[i].name].health < objects[data[i].name].maxHealth / 2) ? objects[data[i].name].health / objects[data[i].name].maxHealth * 0.8 : 0.4;
					if(selectedObj != objects[data[i].name])
						objects[data[i].name].material.materials[0].color.b = 0;
					else
						objects[data[i].name].material.materials[0].color.b = 0.4;
				}
				//console.log("Moved "+data[i].name);
			} else {
				addPlayer(data[i].name, data[i].model, data[i].pos, data[i].scale);
				//console.log("Added "+data[i].name);
			}
		}
		var currObjs = new Object();
	    for (var attr in objects) {
	        if (objects.hasOwnProperty(attr)) currObjs[attr] = objects[attr];
	    }
		delete currObjs.terrain;
		for(var i in data) {
			if(currObjs.hasOwnProperty(data[i].name))
				delete currObjs[data[i].name];
		}
		for(var i in currObjs) {
			remObj(i);
			//console.log("Removed "+i);
		}
		//setInterval(function(){objects[playerName].position.x+=10}, 1000)
		//console.log(currObjs);
	});
	socket.on('uSB', function(data) {
		var arr = decodeArray(data);
		var data = [];
		for(var i=0; i<arr.length/7; i++) {
			if(arr[i*7+6] == isPlaying) {	
				for(var j=0; j<6; j++) {
					data[j] = arr[i*7+j];
				}
				break;
			} else
				continue;
		}
		document.getElementById("heroCount").innerText = data[0];
		document.getElementById("commanderCount").innerText = data[1];
		document.getElementById("minionCount").innerText = data[2];
		document.getElementById("buildingCount").innerText = data[3];
		document.getElementById("invFoodCount").innerText = data[4];
		document.getElementById("invBuildingCount").innerText = data[5];
	});
	socket.on('updateScoreboard', function(data) {
		document.getElementById("heroCount").innerText = data[socket.socket.sessionid].Hero;
		document.getElementById("commanderCount").innerText = data[socket.socket.sessionid].Commanders;
		document.getElementById("minionCount").innerText = data[socket.socket.sessionid].Minions;
		document.getElementById("buildingCount").innerText = data[socket.socket.sessionid].Buildings;
		document.getElementById("invFoodCount").innerText = data[socket.socket.sessionid].Inventory.Food;
		document.getElementById("invBuildingCount").innerText = data[socket.socket.sessionid].Inventory.Building;
	});
	socket.on('endGame', function(data) {
		var won = isPlaying ? data.winner == socket.socket.sessionid : true;
		var who = isPlaying ? won ? "You " : "The other player " : "Player " + (data.winnerID+1) + " ";
		var psst = isPlaying ? won ? "\n\nCongratulations!" : "\n\nBetter luck next time!" : "";
		alert((isPlaying ? "You " : who)+(!isPlaying || won ? "won!" : "lost!")+"\n"+who+"had:\n"+data.heroLeft+" Hero(es) left,\n"+data.commandersLeft+" Commander(s) left,\n"+data.minionsLeft+" Minion(s) left!"+psst);
	});
	socket.on('startGame', function() {
		gameStarted = true;
		var gStatus = document.getElementById('gameStatus');
		gStatus.innerText="Game has started!";
		gStatus.style.color="green";
	});
	document.getElementById("loading").remove();
	document.body.style.cursor="crosshair";
	//document.body.style.cursor="pointer";
	socket.emit('loadedModels');
	//gameUpdate();
	render();
}

function addPlayer(name, model, pos, scale, objectType) {
	//addCube(name, position);
	addObj(name, model+".js", function(object) {
		//object.position = new THREE.Vector3(pos.x,pos.y,pos.z);
		//object.scale.x=25;
		//object.scale.y=25;
		//object.scale.z=25;
		//object.material = new THREE.MeshNormalMaterial();
		object.position = new THREE.Vector3(pos.x,pos.y,pos.z);
		object.scale = new THREE.Vector3(scale.x,scale.y,scale.z);
		object.objectType = objectType;
		//object.position.y = 1000-new THREE.Raycaster(new THREE.Vector3(object.position.x,1000,object.position.z),new THREE.Vector3(0,-1,0)).intersectObject(objects.terrain)[0].distance;
		//console.log(objects[data.name])
	});
}

function onKeyDown(event) {
	if(event.type==='keydown') {
		//console.log(event.keyCode);
		/*
		37 = left
		38 = up
		39 = right
		40 = down
		87 = w
		83 = s
		65 = a
		68 = d
		81 = q
		90 = z
		32 = space
		16 = shift
		17 = ctrl
		*/
		switch (event.keyCode) {
			case 38:
				console.log('up');
				break;
			case 87:
				console.log('w');
				break;
			case 40:
				console.log('down');
				break;
			case 83:
				console.log('s');
				break;
			case 37:
				console.log('left');
				break;
			case 65:
				console.log('a');
				break;
			case 39:
				console.log('right');
				break;
			case 68:
				console.log('d');
				break;
			case 32:
				console.log('jump');
				break;
			case 81:
				console.log('up');
				break;
			case 16:
				console.log('sprint');
				break;
			case 17:
				console.log('crouch');
				break;
			case 90:
				console.log('down');
				break;
			case 74:
				console.log('j');
				var cHeight = prompt('Camera height?',camera.position.y);
				//cHeight = isNaN(parseFloat(cHeight)) ? camera.position.y : parseFloat(cHeight);
				camera.position.y = isNaN(parseFloat(cHeight)) ? camera.position.y : parseFloat(cHeight);;
				break;
			case 72:
				console.log('h');
				socket.emit('nextClickBuild');
				break;
			default:
				console.log('unknown key ('+event.keyCode+')');
				break;
		}
	} else if(event.type==='keyup') {
		
	}
}