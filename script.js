var url;
 
var ws = new WebSocket("wss://avatar.mintclub.org:22222");

var options = {
	zone: document.getElementById('joystick'),
    mode: 'static',
    position: {right: '27%', bottom: '17%'},
	color: 'SpringGreen'
};

var manager = nipplejs.create(options);

manager.on('start', function(evt) {
	document.getElementById('container-joystick').style.visibility = "visible";
});

manager.on('move', function(evt, data) {
	angle = parseInt(data.angle.degree);
	distance = parseInt(data.distance*2);
	console.log(angle + ";" + distance);
	ws.send(angle + ";" + distance);
	console.log("send");
});

manager.on('end', function(evt) {
	document.getElementById('container-joystick').style.visibility = "hidden";
	ws.send("0;0");
});

ws.onopen = function() {
	ws.send("site:" + window.location.pathname.split('/')[1]);
	//ws.send(window.location.href);
};

ws.onmessage = function (evt) {
	url = evt.data;
	console.log(url);
	document.getElementById("ifrm").src = "https://" + url + window.location.pathname;
	document.getElementById('joystick').style.visibility = "visible";
};

let keysPressed = {};

//37 is left, 38 is up, 39 is right, 40 is down



document.addEventListener('keydown', testFunction);

document.addEventListener('keyup', testFunction);

function testFunction(e) {
	alert("Taste gedrückt");
	e = e || window.event;
	keysPressed[e.keyCode] = e.type == 'keydown';
	
	var x = 0;
	var y = 0;
	
	if (keysPressed[37]) {
		x = x - 1;
	}
	if (keysPressed[39]) {
		x = x + 1;
	}
	if (keysPressed[38]) {
		y = y + 1;
	}
	if (keysPressed[40]) {
		y = y - 1;
	}
	
	var angle = 0;
	var strength = 100;
	
	if (x == 0 && y == 0) {
		strength = 0;
	} else if (y == 1) {
		angle = 90 - x*45;
	} else if (y == -1) {
		angle = 270 + x*45;
	} else if (x == -1) {
		angle = 180;
	}
	ws.send(angle + ";" + strength);
}
