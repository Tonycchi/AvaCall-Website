var url;
var ws = new WebSocket("wss://avatar.mintclub.org:22222"); //socket connection to our website

// Create the joystick when opening the website
// size of the joystick varies by your screen size
// capValue is a limit for pc users
var manager;
var optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
var capValue = (screen.height > screen.width) ? screen.height : screen.width;
var bottomPercent = '35%';
if (capValue > 1400) {
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

setManagerEvents();

// Function when the window size changes
// When resizing the window we have to adjust the size of the joystick (destroy old one and create new one)
window.onresize = function() {
	optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
	capValue = (screen.height > screen.width) ? screen.height : screen.width;
	bottomPercent = '35%';
	if (capValue > 1400) {
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

// Function when connecting to the WebSocket Server
// Send an identification message to tell the WebSocket Server with which Client it is connected
ws.onopen = function() {
	ws.send("site:" + window.location.pathname.split('/')[1]);
};

// Function when receiving messages by the WebSocket Server
// Set the source of the iFrame to enter the jitsi call
// Enables the joystick only for people who enter the jitsi call
ws.onmessage = function (evt) {
	url = evt.data;
	console.log(url);
	document.getElementById("ifrm").src = "https://" + url + window.location.pathname;
	document.getElementById('joystick').style.visibility = "visible";
};

// The manager handles the joysticks
// Create the joystick with the options and define functionality for the joystick at certain events
function setManagerEvents() {
	manager = nipplejs.create(options);

	// Function when the joystick is touched
	// Makes the container-joystick visible so that you can drag the joystick over the whole screen
	manager.on('start', function(evt) {
		document.getElementById('container-joystick').style.visibility = "visible";
	});
	
	// Function when the joystick is moved
	// Gets joystick data and sends it to the WebSocket Server
	manager.on('move', function(evt, data) {
		angle = parseInt(data.angle.degree);
		distance = parseInt(data.distance * 2 / (options.size/100));
		console.log(angle + ";" + distance);
		ws.send(angle + ";" + distance);
		console.log("send");
	});
	
	// Function when the joystick is released 
	// Makes the container-joystick hidden so that you can use the buttons on the iFrame again
	// Sends a stop signal so the Mindstorm doesn't continue to move
	manager.on('end', function(evt) {
		document.getElementById('container-joystick').style.visibility = "hidden";
		ws.send("0;0");
	});
};