var url;
var ws = new WebSocket("wss://test.avatar.mintclub.org:22223"); //socket connection to our website
var buttonClicked = false; // boolean if a button is clicked
var buttonClickedID; // saves the id in combination with buttonClicked boolean to determine which button is clicked
var controlElements = []; // save all created control elements in an array
var joystickIDs = [];
var meetingId;
var stallDetected = false;

// Create the joystick when opening the website
// size of the joystick varies by your screen size
// capValue is a limit for pc users

var joystickSizeFactor = 0.25;
// Function when the window size changes
// When resizing the window we have to adjust the size of the joystick (destroy old one and create new one)
window.onresize = function() {
	/*for (let i=0; joystickIDs.length; i++) {
		console.log("Joystick number:"+i+" joystick id:"+joystickIDs[i]);
		if (i == 0) {
			repaintJoystick(joystickIDs[i], true, 'SpringGreen');
		} else {
			repaintJoystick(joystickIDs[i], false, 'SpringGreen');
		}
	}*/
	optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
	capValue = (screen.height > screen.width) ? screen.height : screen.width;
	bottomPercent = '43%';
	if (capValue > 1400) {
		optimalSize = 1200 * optimalSize / capValue;
		bottomPercent = '25%';
	}
	//the back of the joystick/s
	let back = document.getElementsByClassName("back");
	// the front of the joystick/s
	let front = document.getElementsByClassName("front");
	setNewSize(back, optimalSize, 1);
	setNewSize(front, optimalSize, 3);
};

// scales the joystick based on windowSize 
// element is front or back of the joystick
// optimalSize is the size from the joystick
// ratio front smaller than back so we have to scale it differently(front is 3 times smaller than back)
function setNewSize(element, optimalSize, ratio){
	for(i = 0; i < element.length; i++){
		element[i].style.width = (optimalSize * joystickSizeFactor) / ratio + "px";
		element[i].style.height = (optimalSize * joystickSizeFactor) / ratio + "px";
		element[i].style.marginTop = ((optimalSize * joystickSizeFactor) / ratio) / -2 + "px";
		element[i].style.marginLeft = ((optimalSize * joystickSizeFactor) / ratio) / -2 + "px";
	}
}

function repaintJoystick(id, right, colorValue){
	optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
	capValue = (screen.height > screen.width) ? screen.height : screen.width;
	bottomPercent = '43%';
	if (capValue > 1400) {
		optimalSize = 1200 * optimalSize / capValue;
		bottomPercent = '25%';
	}
	
	controlElements[id].destroy();
	if(right){
		options = {
			zone: document.getElementById('joystick' + id),
			mode: 'static',
			position: {right: '27%', bottom: bottomPercent},
			color: colorValue,
			size: optimalSize * joystickSizeFactor
		};
	}else{
		options = {
			zone: document.getElementById('joystick' + id),
			mode: 'static',
			position: {left: '27%', bottom: bottomPercent},
			color: colorValue,
			size: optimalSize * joystickSizeFactor
		};
	}
	controlElements[id] = setManagerEvents(options, id);
}


// Function when connecting to the WebSocket Server
ws.onopen = function() {
	idSubmitted();
};

// Function when receiving messages by the WebSocket Server
// Set the source of the iFrame to enter the jitsi call
// Enables the joystick only for people who enter the jitsi call
ws.onmessage = function (evt) {
	console.log("received: "+evt.data);		
	if (evt.data.startsWith("INVALID")) {
		document.getElementById('notConnected').style.display = 'block';
		document.getElementById('connected').style.display = 'none';
		document.getElementById('meetingIdInput').value = meetingId;
		document.getElementById('errorMessageField').innerHTML = "Die angegebene Kennnummer ist falsch. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut!";
		console.log("The id doesn't exist in server.js");
	} else if (evt.data.startsWith("FULL:")) {
		document.getElementById('connected').style.display = 'block';
		document.getElementById('notConnected').style.display = 'none';
		messageArguments = evt.data.split(':');
		url = messageArguments[1];
		console.log("FULL: " + "https://" + url + "/" + meetingId);		
		document.getElementById("ifrm").src = "https://" + url + "/" + meetingId;

	} else if (evt.data.startsWith("STALL:")) {
		stallArguments = evt.data.split(':');
		if(stallArguments[1]=="start"){
			stallDetectedForType(stallArguments[2], stallArguments[3]);
		}else if(stallArguments[1]=="stop"){
			stallEndedForType(stallArguments[2], stallArguments[3]);
		}else{
			console.log("STALL received but invalid second Argument: "+evt.data);		
		}
	} else if(evt.data.startsWith("DISCONNECT")) {
		document.getElementById('notConnected').style.display = 'block';
		document.getElementById('connected').style.display = 'none';
		document.getElementById('meetingIdInput').value = "";
		document.getElementById('errorMessageField').innerHTML = "Ihr Partner hat die Verbindung geschlossen. Sie können eine neue Kennnummer eingeben.";
		console.log("App disconnected");
	} else{ //goto to the videocall site
		document.getElementById('connected').style.display = 'block';
		document.getElementById('notConnected').style.display = 'none';
		// split our sent message from the app
		messageArguments = evt.data.split(':');
		url = messageArguments[0];
		console.log("source for videocall: "+"https://" + url + "/" + meetingId);
		// split the control elements in an array
		controlElements = messageArguments[1].split('|');
		let joystickCounter = 0;
		let sliderCounter = 0;
		let buttonCounter = 0;
		for (i=0; i<controlElements.length; i++) {
			// saves the id for each control element
			let id;
			switch (controlElements[i]) {
				case "joystick":
					id = i;
					joystickIDs.push(id);
					console.log("Joystick: " + id);
					// create the joystick
					optimalSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
					capValue = (screen.height > screen.width) ? screen.height : screen.width;
					bottomPercent = '43%';
					let right = (27 + joystickCounter * 46) + "%";
					if (capValue > 1400) {
						optimalSize = 1200 * optimalSize / capValue;
						bottomPercent = '25%';
					}
					options = {
						zone: document.getElementById('joystick' + joystickCounter),
						mode: 'static',
						position: {right: right, bottom: bottomPercent},
						color: 'SpringGreen',
						size: optimalSize * joystickSizeFactor
					};
					
					// set the functions when the joystick is moved
					controlElements[i] = setManagerEvents(options, id);
					document.getElementById('joystick' + joystickCounter).style.visibility = "visible";
					joystickCounter++;
					break;
				case "slider":
					id = i;
					console.log("Slider: " + id);
					// create the slider
					let slider = document.createElement("input");
					setSliderAttributes(slider, sliderCounter);
					document.getElementById("slider" + sliderCounter).appendChild(slider);
					// set the functions when the slider is moved
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
					// create the button
					let button = document.createElement("button");
					button.innerHTML = "Feuer " + buttonCounter; 
					button.classList.add("button");
					document.getElementById("button" + buttonCounter).appendChild(button);
					// set the functions when the button is clicked
					button.onmousedown = function() {
						console.log(id);
						console.log("Button "+id+" activity: " + 1);
						document.getElementById('container-control-elements').style.visibility = "visible";
						ws.send(id + ":" + 1);
						buttonClicked = true;
						buttonClickedID = id;
					}
					
					window.addEventListener('mouseup', function(event){
						if(buttonClicked){
							console.log("Button "+buttonClickedID+" activity: " + 0);
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
		document.getElementById("ifrm").src = "https://" + url + "/" + meetingId;
		
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

function stallDetectedForType(type, id) {
	switch(type) {
		case "button":
			buttonStallDetected(id);
			break;
		case "slider":
			sliderStallDetected(id);
			break;
		case "joystick":
			joystickStallDetected(id);
			break;
	}
}

function stallEndedForType(type, id) {
	switch(type) {
		case "button":
			buttonStallEnded(id);
			break;
		case "slider":
			sliderStallEnded(id);
			break;
		case "joystick":
			joystickStallEnded(id);
			break;
	}
}

function buttonStallDetected(id) {
	if(!stallDetected) {
		let pressedButton = controlElements[id];
		pressedButton.style.backgroundColor = "Red";
		pressedButton.style.borderColor = "Red";
		stallIsDetected();
	}
}

function buttonStallEnded(id) {
	if(stallDetected) {
		let button = controlElements[id];
		button.style.backgroundColor = "PaleGreen";
		button.style.borderColor = "PaleGreen";
		stallIsEnded();
	}
}

function sliderStallDetected(id) { 
	if(!stallDetected) {
		let slider = controlElements[id];
		slider.style.background = "Red";
		stallIsDetected();
	}
}

function sliderStallEnded(id) { 
	if(stallDetected) {
		let slider = controlElements[id];
		slider.style.background = "LightGrey";
		stallIsEnded(); 
	}
}

function joystickStallDetected(id) {
	if(!stallDetected) {
		changeJoystickColor(id, "Red");		
		stallIsDetected();
	}
}

function joystickStallEnded(id) {
	if(stallDetected) {
		changeJoystickColor(id, "SpringGreen");
		stallIsEnded();
	}
}

function changeJoystickColor(id, color) {
	let joystick;
	for(i = 0; i < joystickIDs.length; i++) { 
		if(id == joystickIDs[i]) {
			joystick = document.getElementById("joystick" + i);
			break;
		}
	}
	let back = joystick.getElementsByClassName("back");
	let front = joystick.getElementsByClassName("front");
	back[0].style.background = color;
	front[0].style.background = color;

}

function stallIsDetected() {
	stallDetected = true;
	document.getElementById("border").style.display = 'block'; //show overlay
}

function stallIsEnded() {
	stallDetected = false;
	document.getElementById("border").style.display = 'none'; //hide overlay
}

function setSliderAttributes(slider, sliderCounter) {
	slider.setAttribute("type", "range");
	slider.classList.add("slider");
	slider.style.transform = "rotate(270deg)";
	slider.style.left = (sliderCounter * 9 + slider.style.left) + "%";
}

//check if there is an meetingID parameter and if go to that site
function idSubmitted() {
	let parameters = window.location.search.substr(1).split("&");
	console.log("parameters:" + parameters);
	meetingId = parameters[0].split("=")[1];
	if(meetingId != null){ //if the site was started with from app generated link
		console.log("started with link. meetingId:" + meetingId);
		ws.send("site:" + meetingId); // Send an identification message to tell the WebSocket Server with which Client it is connected
		console.log("send: site:" + meetingId);
	}
}