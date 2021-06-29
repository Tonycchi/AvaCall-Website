var url;
var ws = new WebSocket("wss://test.avatar.mintclub.org:22223"); //socket connection to our website
var buttonClicked = false;
var controlElements = [];

// Create the joystick when opening the website
// size of the joystick varies by your screen size
// capValue is a limit for pc users

var joystickSizeFactor = 0.25;
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
	controlElements[0].destroy();
	options = {
		zone: document.getElementById('joystick'),
		mode: 'static',
		position: {right: '27%', bottom: bottomPercent},
		color: 'SpringGreen',
		size: optimalSize * joystickSizeFactor
	};
	controlElements[0] = setManagerEvents(options, 0);
};

let button1 = document.createElement("button");
button1.innerHTML = "Click Me1";
button1.classList.add("button");
document.getElementById("button1").appendChild(button1);

let button2 = document.createElement("button");
button2.innerHTML = "Click Me2";
button2.classList.add("button");
document.getElementById("button2").appendChild(button2);

let button3 = document.createElement("button");
button3.innerHTML = "Click Me3";
button3.classList.add("button");
document.getElementById("button3").appendChild(button3);

let button4 = document.createElement("button");
button4.innerHTML = "Click Me4";
button4.classList.add("button");
document.getElementById("button4").appendChild(button4);

let slider1 = document.createElement("input");
slider1.setAttribute("type", "range");
slider1.classList.add("slider");
document.getElementById("slider1").appendChild(slider1);

let slider2 = document.createElement("input");
slider2.setAttribute("type", "range");
slider2.classList.add("slider");
document.getElementById("slider2").appendChild(slider2);

let slider3 = document.createElement("input");
slider3.setAttribute("type", "range");
slider3.classList.add("slider");
document.getElementById("slider3").appendChild(slider3);

let slider4 = document.createElement("input");
slider4.setAttribute("type", "range");
slider4.classList.add("slider");
document.getElementById("slider4").appendChild(slider4);

// Function when connecting to the WebSocket Server
// Send an identification message to tell the WebSocket Server with which Client it is connected
ws.onopen = function() {
	ws.send("site:" + window.location.pathname.split('/')[1]);
};

// Function when receiving messages by the WebSocket Server
// Set the source of the iFrame to enter the jitsi call
// Enables the joystick only for people who enter the jitsi call
ws.onmessage = function (evt) {
	messageArguments = evt.data.split(':');
	url = messageArguments[0];
	console.log(url);
	document.getElementById("ifrm").src = "https://" + url + window.location.pathname;
	document.getElementById('joystick').style.visibility = "visible";
	controlElements = messageArguments[1].split('|');
	for (i=0; i<controlElements.length; i++) {
		let id;
		switch (controlElements[i]) {
			case "joystick":
				id = i;
				console.log("Joystick: " + i);
				optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
				capValue = (screen.height > screen.width) ? screen.height : screen.width;
				bottomPercent = '35%';
				if (capValue > 1400) {
					optimalSize = 1200 * optimalSize / capValue;
					bottomPercent = '25%';
				}
				options = {
					zone: document.getElementById('joystick'),
					mode: 'static',
					position: {right: '27%', bottom: bottomPercent},
					color: 'SpringGreen',
					size: optimalSize * joystickSizeFactor
				};

				
				controlElements[i] = setManagerEvents(options, id);;
				break;
			case "slider":
				document.getElementById('slider').style.visibility = "visible";
				id = i;
				console.log("Slider: " + id);
				slider = document.getElementById('slider');
				slider.oninput = function() {
					console.log(id);
					console.log("Slider deflection: " + this.value);
					ws.send(id + ":" + this.value);
				}
				
				slider.onmouseup = function() {
					this.value = 0;
					ws.send(id + ":" + this.value);
				}

				controlElements[i] = slider;
				break;
			case "button":
				document.getElementById('button').style.visibility = "visible";
				id = i;
				console.log("Button: " + id);
				button = document.getElementById('button');
				button.onmousedown = function() {
					console.log("Button activity: " + 1);
					document.getElementById('container-control-elements').style.visibility = "visible";
					ws.send(id + ":" + 1);
					buttonClicked = true;
				}
				
				window.addEventListener('mouseup', function(event){
					if(buttonClicked){
						console.log("Button activity: " + 0);
						document.getElementById('container-control-elements').style.visibility = "hidden";
						ws.send(id + ":" + 0);
						buttonClicked = false;
					}
				})

				controlElements[i] = button;
				break;
			default:
				//TODO: Error message (no control elements)
		}
	}
};

// The manager handles the joysticks
// Create the joystick with the options and define functionality for the joystick at certain events
function setManagerEvents(options, id) {
	manager = nipplejs.create(options);

	// Function when the joystick is touched
	// Makes the container-joystick visible so that you can drag the joystick over the whole screen
	manager.on('start', function(evt) {
		document.getElementById('container-control-elements').style.visibility = "visible";
	});
	
	// Function when the joystick is moved
	// Gets joystick data and sends it to the WebSocket Server
	manager.on('move', function(evt, data) {
		angle = parseInt(data.angle.degree);
		distance = parseInt(data.distance * 2 / (options.size/100));
		console.log(angle + ";" + distance);
		ws.send(id + ":" + angle + ";" + distance);
		// ws.send(angle;distance|slider.value|button.value)
		console.log("send");
	});
	
	// Function when the joystick is released 
	// Makes the container-joystick hidden so that you can use the buttons on the iFrame again
	// Sends a stop signal so the Mindstorm doesn't continue to move
	manager.on('end', function(evt) {
		document.getElementById('container-control-elements').style.visibility = "hidden";
		ws.send(id + ":0;0");
	});
	
	return manager;
};
