const crypto = require("crypto");
const express = require('express');
const cors = require('cors');

const http = require("http");
const websocketServer = require("websocket").server;



const clients = new Map();
const api = express();
api.use(cors());
api.use(express.json());
const httpServer = http.createServer(api);
httpServer.listen(9090, () => console.log("Server is listening on port 9090"));

const lobbies = new Map();

// Vals of Clients Map
//const clientData = {
//     connection: connection,
//     username: null,
// };

// Vals of Lobby map
// lobbies.set(req.body.lobbyId, {maxPlayers: req.body.maxPlayers, host: "", players: [], state: "lobby"});

function CreateLobbyId(len){
    let newLobbyId = "";

    for(let i = 0; i < len; i++){
        let randNum = Math.floor(Math.random() * 10);
        newLobbyId += randNum.toString();
    }
    return newLobbyId;
}

api.post('/api/createLobby', (req, res) => {
    console.log("SETTINGS: ")
    console.log(req.body.maxPlayers);

    lobbies.set(req.body.lobbyId, {maxPlayers: req.body.maxPlayers, host: "", players: [], state: "lobby"});
    console.log(lobbies);
    res.send("1");
})

api.get('/api/createLobbyId', (req, res) => {
    console.log("Sent Lobby ID");
    const id = CreateLobbyId(6)
    console.log(id);
    res.send(id);
})

const wsServer = new websocketServer({
  httpServer: httpServer,
}); 

// Expects message passed in to be JSON.stringfy()'d already
function broadcastToLobby(lobbyId, stringifiedMessage){
    let lobby = lobbies.get(lobbyId);
    for(const clientID of lobby.players){
        clients.get(clientID).connection.send(stringifiedMessage);
    }
}

function broadcastToLobbyFromHost(lobbyId, stringifiedMessage){
    let lobby = lobbies.get(lobbyId);
    for(const clientID of lobby.players){
        if(clientID !== lobby.host)
        clients.get(clientID).connection.send(stringifiedMessage);
        
    }
}


wsServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);
    const clientId = crypto.randomUUID();
    let curLobbyId = "";

    const clientData = {
        connection: connection,
        username: null,
    };

    connection.on("close", () => {
        clients.delete(clientId);
        console.log(clients.size);
        console.log("Connection closed");
    });

    connection.on("message", (message) => {
        const res = JSON.parse(message.utf8Data);

        if(res.method === "connect"){
            if(res.clientId === clientId){
                let lobby = lobbies.get(res.lobbyId);
                curLobbyId = res.lobbyId

                lobby.players.push(res.clientId);
                if(lobby.players.length === 1){
                    console.log("First Connection");
                    lobby.host = clientId;
                    const payload = {
                        method: "setHost",
                    }
                    connection.send(JSON.stringify(payload))
                }
            } 
            console.log(lobbies);
            
        }

        if(res.method === "setUsername"){
            clientData.username = res.username;
            console.log(`Client ${clientId} set username: ${res.username}`);
            console.log(clients);
        }

        if(res.method === "startGame"){
            if(curLobbyId != ""){
                const payload = {
                    method: "loadGame",
                }

                broadcastToLobby(curLobbyId, JSON.stringify(payload));
            }
            
        }

        if(res.method === "setCity"){
            const payload = {
                method: "setCity",
                city: res.city,
                imageIds: res.imageIds,
                startingImageIdx: res.startingImageIdx
            }
            broadcastToLobby(curLobbyId, JSON.stringify(payload));
        }

        console.log(res);
        console.log(clients.size);
    });

    
    

    connection.on("error", (err) => {
    console.error(`Client ${clientId} error:`, err);
  });


    clientData.connection = connection;
    
    clients.set(clientId, clientData);
    console.log(`Client connected: ${clientId}`);

    const payLoad = {
        method: "connect",
        clientId: clientId,
    }

    connection.send(JSON.stringify(payLoad));
});