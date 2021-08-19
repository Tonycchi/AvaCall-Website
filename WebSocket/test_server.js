const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const server = new https.createServer({
	cert: fs.readFileSync('/etc/letsencrypt/live/test.avatar.mintclub.org/fullchain.pem'),
	key: fs.readFileSync('/etc/letsencrypt/live/test.avatar.mintclub.org/privkey.pem')
});

const wss = new WebSocket.Server({ server });
appClients = {}; //Room-ID -> app connected to the server
webClients = {}; //Room-ID -> web client that controls an avatar 
jitsiURLs = {}; //Room-ID -> jitsi url 
controlElements = {}; //Room-ID -> control elements
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
            messageArguments = message.split(':');
            jitsiURLs[id] = messageArguments[1];
            controlElements[id] = messageArguments[2];
			console.log(jitsiURLs[id]);

			//create entry for app
            appClients[id] = ws;
            appClients[id].myid = id;
            
			//send room-id to app
            appClients[id].send('id:' + id);
            
			appClients[id].on('message', function(m) {
                //if web is still connected -> send (probably stall)
				if (webClients[this.myid] != null) {
					webClients[this.myid].send(m);  
				}
            });
			
            appClients[id].on('close', function() {
				delete appClients[id];
                removeSession(this.myid);
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
				webClients[id].send(jitsiURLs[id] + ":" + controlElements[id]);
                
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
					delete webClients[this.myid];
                    removeSession(this.myid); //session is just removed when there is no app and web client
                });
				
			//when there is already one web client connected 
            } else if (appClients[id] != null) {
                ws.send("FULL:" + jitsiURLs[id] + ":" + id);
            //when room-id doesn't exist 
			}else{
				ws.send("INVALID: Id "+id+" is invalid!");
				console.log("INVALID: Id "+id+" is invalid!");
			}	
        }
        if (!message.includes(";")) console.log(countProperties(appClients) + ", " + countProperties(webClients))
    });
});

//removes room-id from list, if there is no app or no web client
function removeSession(id) {
    if (appClients[id] == null && webClients[id] == null) {
		console.log("session "+id+" removed");
        delete jitsiURLs[id];
        var index = IDs.indexOf(id);
        if (index > -1) {
            IDs.splice(index, 1);
        }
    }else if(appClients[id] != null && webClients[id] == null){ //web disconnected before app
		console.log("web "+id+" disconnected");
		appClients[id].send("DISCONNECT");
	}else if(webClients[id] != null && appClients[id] == null ){//app disconnected before web
		console.log("app "+id+" disconnected");
		webClients[id].send("DISCONNECT");
		delete webClients[id]; //delete web clients entry because if app disconnects web can't do anything and is redirected to start page
		removeSession(id);
	}else{
		console.log("This should not happen!");
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

server.listen(22223);
