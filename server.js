const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const server = new https.createServer({
	cert: fs.readFileSync('/etc/letsencrypt/live/mintclub.org/fullchain.pem'),
	key: fs.readFileSync('/etc/letsencrypt/live/mintclub.org/privkey.pem')
});

const wss = new WebSocket.Server({ server });
appClients=[];
avatarURLs=[];
jitsiURLs=[];

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
	if (message == 'app') {
	    appClients.push(ws);
		console.log("App connected");
		ws.on('message', function(URL) {
			if (URL.includes("avatar.mintclub.org")) {
					avatarURLs.push(URL);
					console.log("Pushed avatarURL");
			} else {
					jitsiURLs.push(URL);
					console.log("Pushed jitsiURL");
			}	
	    });
	} else if (message == 'site') {
		var connectedAppClient;
	    console.log("Website connected");
		ws.on('message', function(message) {
			if (message.includes("avatar.mintclub.org")) {
				for (var i=0; i<avatarURLs.length; i++) {
					if (message == avatarURLs[i]) {
						ws.send(jitsiURLs[i]);
						connectedAppClient = appClients[i];
						console.log("Connected to App");
						break;
					}
				}
			} else if (connectedAppClient != null) {
				connectedAppClient.send(message);
				console.log("Sent: " + message);
			}
		});
	}
    });
});

server.listen(22222);