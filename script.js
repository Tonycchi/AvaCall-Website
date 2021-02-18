var url;
 
var ws = new WebSocket("wss://mintclub.org:22222");

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
