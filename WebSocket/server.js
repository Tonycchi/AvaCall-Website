const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const server = new https.createServer({
	cert: fs.readFileSync('/etc/letsencrypt/live/avatar.mintclub.org/fullchain.pem'),
	key: fs.readFileSync('/etc/letsencrypt/live/avatar.mintclub.org/privkey.pem')
});

const wss = new WebSocket.Server({ server });
appClients = {}; //Room-ID -> app connected to the server
webClients = {}; //Room-ID -> web client that controls an avatar 
jitsiURLs = {}; //Room-ID -> jitsi url 
IDs = [];	//Room-ID


wss.on('connection', function(ws, request, client) {
	//when message is received
    ws.on('message', function(message) {
        //communicating with app
		if (message.startsWith('app:')) {//e.g.: "app:meet.jit.si"
            //create id
			id = randomID(10); 
            IDs.push(id);
            
			//remember jitsi URL
            jitsiURLs[id] = message.split(':')[1]; 
			console.log(jitsiURLs[id]);
            
			//create entry for app
            appClients[id] = ws;
            appClients[id].myid = id;
            
			//send room-id to app
            appClients[id].send('id:' + id);
            
            appClients[id].on('close', function() {
                removeSession(this.myid);//session is just removed, when there is no app client -> meaning session is just removed when there is no app and web client after this method
                delete appClients[id];
            });
			
		//communicating with web
        } else if (message.startsWith('site:')) {//e.g.: "site:asdfasdfas"
            id = message.split(':')[1];
            //when there is an app for this id and there isn't any other web client
			if (appClients[id] != null && webClients[id] == null) {
                //create entry for web client
				webClients[id] = ws;
                webClients[id].myid = id;
                
				//send jitsi-url to web client
				webClients[id].send(jitsiURLs[id]);
                
                webClients[id].on('message', function(m) {
					//when app is still connected -> send
                    if (appClients[this.myid] != null) {
                        appClients[this.myid].send(m);  
                    //when app isn't connected -> delete entry for web client
					} else {
                        removeSession(this.myid);//session is just removed, when there is no app client -> meaning session is just removed when there is no app and web client after this method
                        delete webClients[this.myid];
                    }
                });
				
                webClients[id].on('close', function() {
                    removeSession(this.myid); //session is just removed, when there is no app client -> meaning session is just removed when there is no app and web client after this method
                    delete webClients[this.myid];
                });
				
			//when there is already one web client connected 
            } else if (appClients[id] != null) {
                ws.send(jitsiURLs[id] + "/");
            //when room-id doesn't exist 
			}else{
				//TODO: what to do if id is invalid
			}	
        }
        if (!message.includes(";")) console.log(countProperties(appClients) + ", " + countProperties(webClients))
    });
});

//removes room-id from list, if there is no app or no web client
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

//return an ID that doesn't exist yet
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
