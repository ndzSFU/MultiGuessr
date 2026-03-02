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

    lobbies.set(req.body.lobbyId, {maxPlayers: req.body.maxPlayers})
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



wsServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);
    const clientId = crypto.randomUUID();

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

        }

        if(res.method === "setUsername"){
            clientData.username = res.username;
            console.log(`Client ${clientId} set username: ${res.username}`);
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