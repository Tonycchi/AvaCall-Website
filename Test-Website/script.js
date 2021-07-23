var url;
var ws = new WebSocket("wss://test.avatar.mintclub.org:22223"); //socket connection to our website
var buttonClicked = false;
var buttonClickedID;
var controlElements = [];
var joystickIDs = [];

// Create the joystick when opening the website
// size of the joystick varies by your screen size
// capValue is a limit for pc users

var joystickSizeFactor = 0.25;
// Function when the window size changes
// When resizing the window we have to adjust the size of the joystick (destroy old one and create new one)
window.onresize = function() {
	optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
	capValue = (screen.height > screen.width) ? screen.height : screen.width;
	bottomPercent = '43%';
	if (capValue > 1400) {
		optimalSize = 1200 * optimalSize / capValue;
		bottomPercent = '25%';
	}
	for (let i=0; joystickIDs.length; i++) {
		if (i == 0) {
			controlElements[joystickIDs[i]].destroy();
			options = {
				zone: document.getElementById('joystick' + i),
				mode: 'static',
				position: {right: '27%', bottom: bottomPercent},
				color: 'SpringGreen',
				size: optimalSize * joystickSizeFactor
			};
			controlElements[joystickIDs[i]] = setManagerEvents(options, joystickIDs[i]);
		} else {
			controlElements[joystickIDs[i]].destroy();
			options = {
				zone: document.getElementById('joystick' + i),
				mode: 'static',
				position: {left: '27%', bottom: bottomPercent},
				color: 'SpringGreen',
				size: optimalSize * joystickSizeFactor
			};
			controlElements[joystickIDs[i]] = setManagerEvents(options, joystickIDs[i]);
		}
	}
};

// Function when connecting to the WebSocket Server
// Send an identification message to tell the WebSocket Server with which Client it is connected
ws.onopen = function() {
	ws.send("site:" + window.location.pathname.split('/')[1]);
	console.log("site:" + window.location.pathname.split('/')[1]);
};

// Function when receiving messages by the WebSocket Server
// Set the source of the iFrame to enter the jitsi call
// Enables the joystick only for people who enter the jitsi call
ws.onmessage = function (evt) {
	messageArguments = evt.data.split(':');
	url = messageArguments[0];
	console.log(url);
	document.getElementById("ifrm").src = "https://" + url + window.location.pathname;
	controlElements = messageArguments[1].split('|');
	let joystickCounter = 0;
	let sliderCounter = 0;
	let buttonCounter = 0;
	for (i=0; i<controlElements.length; i++) {
		let id;
		switch (controlElements[i]) {
			case "joystick":
				id = i;
				joystickIDs.push(id);
				console.log("Joystick: " + id);
				optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
				capValue = (screen.height > screen.width) ? screen.height : screen.width;
				bottomPercent = '43%';
				if (capValue > 1400) {
					optimalSize = 1200 * optimalSize / capValue;
					bottomPercent = '25%';
				}
				if (joystickCounter == 0) {
					options = {
						zone: document.getElementById('joystick' + joystickCounter),
						mode: 'static',
						position: {right: '27%', bottom: bottomPercent},
						color: 'SpringGreen',
						size: optimalSize * joystickSizeFactor
					};
					
					controlElements[i] = setManagerEvents(options, id);
					document.getElementById('joystick' + joystickCounter).style.visibility = "visible";
				} else {
					options = {
						zone: document.getElementById('joystick' + joystickCounter),
						mode: 'static',
						position: {left: '27%', bottom: bottomPercent},
						color: 'SpringGreen',
						size: optimalSize * joystickSizeFactor
					};
					
					controlElements[i] = setManagerEvents(options, id);
					document.getElementById('joystick' + joystickCounter).style.visibility = "visible";
				}
				joystickCounter++;
				break;
			case "slider":
				id = i;
				console.log("Slider: " + id);
				let slider = document.createElement("input");
				setSliderAttributes(slider, sliderCounter);
				document.getElementById("slider" + sliderCounter).appendChild(slider);
				slider.oninput = function() {
					console.log(id);
					console.log("Slider deflection: " + this.value);
					ws.send(id + ":" + this.value);
				}
				
				slider.onmouseup = function() {
					this.value = 50;
					ws.send(id + ":" + this.value);
				}

				controlElements[i] = slider;
				sliderCounter++;
				break;
			case "button":
				id = i;
				console.log("Button: " + id);
				let button = document.createElement("button");
				button.innerHTML = "Feuer " + buttonCounter; 
				button.classList.add("button");
				document.getElementById("button" + buttonCounter).appendChild(button);
				button.onmousedown = function() {
					console.log(id);
					console.log("Button activity: " + 1);
					document.getElementById('container-control-elements').style.visibility = "visible";
					ws.send(id + ":" + 1);
					buttonClicked = true;
					buttonClickedID = id;
				}
				
				window.addEventListener('mouseup', function(event){
					if(buttonClicked){
						console.log("Button activity: " + 0);
						document.getElementById('container-control-elements').style.visibility = "hidden";
						ws.send(buttonClickedID + ":" + 0);
						buttonClicked = false;
					}
				})

				controlElements[i] = button;
				buttonCounter++;
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
		console.log(id);
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

function setSliderAttributes(slider, sliderCounter) {
	slider.setAttribute("type", "range");
	slider.classList.add("slider");
	slider.style.transform = "rotate(270deg)";
	slider.style.left = (sliderCounter * 9 + slider.style.left) + "%";
}
