const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const server = new https.createServer({
	cert: fs.readFileSync('/etc/letsencrypt/live/avatar.mintclub.org/fullchain.pem'),
	key: fs.readFileSync('/etc/letsencrypt/live/avatar.mintclub.org/privkey.pem')
});

const wss = new WebSocket.Server({ server });
appClients = {};
webClients = {};
jitsiURLs = {};
IDs = [];

wss.on('connection', function(ws, request, client) {
    ws.on('message', function(message) {
        console.log(message);
        if (message.startsWith('app:')) {
            id = randomID(10);
            IDs.push(id);
            
            jitsiURLs[id] = message.split(':')[1];
            
            appClients[id] = ws;
            appClients[id].myid = id;
               
            appClients[id].send('id:' + id);
            
            appClients[id].on('close', function() {
                removeSession(this.myid);
                
                delete appClients[id];
            });
        } else if (message.startsWith('site:')) {
            id = message.split(':')[1];
            if (appClients[id] != null && webClients[id] == null) {
                webClients[id] = ws;
                webClients[id].myid = id;
                webClients[id].send(jitsiURLs[id]);
                
                /*appClients[id].on('message', function(m) {
                    webClients[this.myid].send(m);
                });*/
                webClients[id].on('message', function(m) {
                    if (appClients[this.myid] != null) {
                        appClients[this.myid].send(m);  
                    } else {
                        removeSession(this.myid);
                        
                        delete webClients[this.myid];
                    }
                });
                webClients[id].on('close', function() {
                    removeSession(this.myid);
                    
                    delete webClients[this.myid];
                });
            } else if (appClients[id] != null) {
                // Trifft ein wenn schon ein webClient mit der App verbunden ist
                ws.send(jitsiURLs[id] + "/");
            }
        }
        if (!message.includes(";")) console.log(countProperties(appClients) + ", " + countProperties(webClients))
    });
});

function removeSession(id) {
    if (appClients[id] == null || webClients[id] == null) {
        delete jitsiURLs[id];
        var index = IDs.indexOf(id);
        if (index > -1) {
            IDs.splice(index, 1);
        }
    }
    console.log(countProperties(appClients) + ", " + countProperties(webClients));
}

function randomID(length) {
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    do {
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
    } while (IDs.includes(result));
    return result;
}

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}

server.listen(22222);
