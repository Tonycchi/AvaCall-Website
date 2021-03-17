var url;

var ws = new WebSocket("wss://avatar.mintclub.org:22222");

var optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
var capValue = (screen.height > screen.width) ? screen.height : screen.width;
var bottomPercent = '35%';
if (capValue > 1900) {
	optimalSize = 1200 * optimalSize / capValue;
	bottomPercent = '25%';
}
var joystickSizeFactor = 0.25;
var options = {
	zone: document.getElementById('joystick'),
    	mode: 'static',
    	position: {right: '27%', bottom: bottomPercent},
	color: 'SpringGreen',
	size: optimalSize * joystickSizeFactor
};

var manager;

setManagerEvents();

window.onresize = function() {
	optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
	capValue = (screen.height > screen.width) ? screen.height : screen.width;
	bottomPercent = '35%';
	if (capValue > 1900) {
		optimalSize = 1200 * optimalSize / capValue;
		bottomPercent = '25%';
	}
	manager.destroy();
	options = {
		zone: document.getElementById('joystick'),
		mode: 'static',
		position: {right: '27%', bottom: bottomPercent},
		color: 'SpringGreen',
		size: optimalSize * joystickSizeFactor
	};
	setManagerEvents();
};

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

function setManagerEvents() {
	manager = nipplejs.create(options);

	manager.on('start', function(evt) {
		document.getElementById('container-joystick').style.visibility = "visible";
	});
	
	manager.on('move', function(evt, data) {
		angle = parseInt(data.angle.degree);
		distance = parseInt(data.distance * 2 / (options.size/100));
		console.log(angle + ";" + distance);
		ws.send(angle + ";" + distance);
		console.log("send");
	});
	
	manager.on('end', function(evt) {
		document.getElementById('container-joystick').style.visibility = "hidden";
		ws.send("0;0");
	});
};