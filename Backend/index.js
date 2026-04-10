const crypto = require("crypto");
const express = require('express');
const cors = require('cors');

const http = require("http");
const websocketServer = require("websocket").server;

const api = express();
api.use(cors());
api.use(express.json());
const httpServer = http.createServer(api);

const lobbies = new Map();
const clients = new Map();
const mapillaryImageCache = new Map();
const mapillaryImageInFlight = new Map();

// Vals of Clients Map
//const clientData = {
//     connection: connection,
//     username: null,
// };

// Vals of Lobby map
// lobbies.set(req.body.lobbyId, {maxPlayers: , maxRounds: , host: "", players: [], state: "lobby", scoreMap: , guessesMade: 0, roundScores: [[]]}});

//Note player and client are used synonymously, a list of players may contain clientId's clients == players

function CreateLobbyId(len){
    let newLobbyId = "";

    for(let i = 0; i < len; i++){
        let randNum = Math.floor(Math.random() * 10);
        newLobbyId += randNum.toString();
    }
    return newLobbyId;
}

function getMapillaryCacheKey(lat, lon){
    return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

//Returns a promise
async function fetchMapillaryImageIds(lat, lon, accessToken){
    const bboxOffset = 0.001;

    const minLon = lon - bboxOffset;
    const maxLon = lon + bboxOffset;
    const minLat = lat - bboxOffset;
    const maxLat = lat + bboxOffset;

    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    const url = 'https://graph.mapillary.com/images?' +
        'access_token=' + accessToken +
        '&fields=id&bbox=' + bbox +
        '&limit=400';

    const retryMax = 5;
    let response = await fetch(url);
    let retryCount = 0;

    while(!response.ok && retryCount < retryMax){
        console.log(`Mapillary fetch retry ${retryCount + 1} for ${lat}, ${lon}`);
        response = await fetch(url);
        retryCount++;
    }

    console.log(response);

    if(!response.ok){
        throw new Error(`Mapillary request failed after ${retryCount + 1} attempts`);
    }

    const payload = await response.json();

    console.log(payload);
    if(!Array.isArray(payload?.data)){
        throw new Error('Mapillary response did not contain image data');
    }

    return payload.data.map((entry) => entry.id).filter(Boolean);
}

api.get('/api/mapillary-images', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const accessToken = typeof req.query.token === 'string' ? req.query.token : process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN;

    console.log("Going to grab an imageID")

    if(Number.isNaN(lat) || Number.isNaN(lon) || !accessToken){
        res.status(400).json({ message: 'Invalid lat/lon' });
        return;
    }

    const cacheKey = getMapillaryCacheKey(lat, lon);

    if(mapillaryImageCache.has(cacheKey)){
        res.json({ data: mapillaryImageCache.get(cacheKey) });
        return;
    }

    let inFlight = mapillaryImageInFlight.get(cacheKey);
    if(!inFlight){
        //inFlight is a promise until which is unfulfilled until the .then
        inFlight = fetchMapillaryImageIds(lat, lon, accessToken)
            .then((imageIds) => {
                mapillaryImageCache.set(cacheKey, imageIds);
                return imageIds;
            })
            .finally(() => {
                mapillaryImageInFlight.delete(cacheKey);
            });

        mapillaryImageInFlight.set(cacheKey, inFlight);
    }

    try{
        const imageIds = await inFlight;
        res.json({ data: imageIds });
    } catch(error){
        console.error('Mapillary proxy failed:', error);
        res.status(502).json({ message: 'Failed to fetch Mapillary images' });
    }
});

api.post('/api/createLobby', (req, res) => {
    console.log("SETTINGS: ")
    console.log(req.body.maxPlayers);

    lobbies.set(req.body.lobbyId, {gameMode: req.body.gameMode, timeLimit: req.body.timeLimit, maxPlayers: req.body.maxPlayers, maxRounds: req.body.maxRounds, curRound: 1, host: "", players: [], state: "lobby", scoreMap: new Map(), guessesMade: 0, roundScores: [[]], roundLatLngs: [[]]});
    console.log(lobbies);
    res.send("1");
})

api.get('/api/createLobbyId', (req, res) => {
    console.log("Sent Lobby ID");
    let id = CreateLobbyId(6)
    while(lobbies.has(id)){
        id = CreateLobbyId(6);
    }
    console.log(id);
    res.send(id);
})

const wsServer = new websocketServer({
  httpServer: httpServer,
}); 

function safeSendConnection(connection, stringifiedMessage){
    if(!connection || connection.connected !== true){
        return false;
    }

    try{
        connection.send(stringifiedMessage);
        return true;
    } catch(err){
        console.error("WebSocket send failed:", err);
        return false;
    }
}

function safeSendToClient(clientID, stringifiedMessage, clientsMap = clients){
    const client = clientsMap.get(clientID);
    if(!client?.connection){
        return false;
    }

    const sent = safeSendConnection(client.connection, stringifiedMessage);
    if(!sent){
        clientsMap.delete(clientID);
    }
    return sent;
}

// Expects message passed in to be JSON.stringfy()'d already
function broadcastToLobby(lobbyId, stringifiedMessage, lobbiesMap = lobbies, clientsMap = clients){
    let lobby = lobbiesMap.get(lobbyId);
    if(!lobby){
        return;
    }

    lobby.players = lobby.players.filter((playerId) => safeSendToClient(playerId, stringifiedMessage, clientsMap));
}

// Probably don't need anymore? 
// function broadcastToLobbyFromHost(lobbyId, stringifiedMessage){
//     let lobby = lobbies.get(lobbyId);
//     for(const clientID of lobby.players){
//         if(clientID !== lobby.host)
//         clients.get(clientID).connection.send(stringifiedMessage);
        
//     }
// }


wsServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);
    const clientId = crypto.randomUUID();
    let curLobbyId = "";

    const clientData = {
        connection: connection,
        username: null,
    };

    connection.on("close", () => {
        // Remove from lobby if they were in one
        if (curLobbyId) {
            const lobby = lobbies.get(curLobbyId);

            clients.delete(clientId);
            if (lobby) {
                // Remove player from players array
                lobby.players = lobby.players.filter(id => id !== clientId);
                
                // Remove from scoreMap
                lobby.scoreMap.delete(clientId);
                
                // If they were host, assign new host (or delete lobby if empty)
                if (lobby.host === clientId) {
                    if (lobby.players.length > 0) {
                        lobby.host = lobby.players[0];
                        safeSendToClient(lobby.host, JSON.stringify({ method: "setHost" }));
                    } else {
                        // No players left, delete the lobby
                        lobbies.delete(curLobbyId);
                    }
                }
                
                console.log(`Player ${clientId} left lobby ${curLobbyId}`);
            }
        }
        
        clients.delete(clientId);
        console.log(clients.size);
        console.log("Connection closed");
    });

    connection.on("message", (message) => {
        const res = JSON.parse(message.utf8Data);

        if(res.method === "connect"){
            if(res.clientId === clientId){
                const tryJoinLobby = (attempt) => {
                    const lobby = lobbies.get(res.lobbyId);

                    if(lobby === undefined){
                        if(attempt === 0){
                            setTimeout(() => tryJoinLobby(1), 2000);
                            return;
                        }
                        if(attempt === 1){
                            setTimeout(() => tryJoinLobby(2), 4000);
                            return;
                        }

                        safeSendConnection(connection, JSON.stringify({
                            method: "error",
                            message: "Lobby does not exist",
                        }));

                        console.log("Attemp: " + attempt);
                        return;
                    }

                    curLobbyId = res.lobbyId;

                    if(!lobby.players.includes(res.clientId)){
                        lobby.players.push(res.clientId);
                    }

                    if(lobby.players.length === 1 || lobby.host === '' || lobby.host === clientId){
                        console.log("First Connection");
                        lobby.host = clientId;
                        safeSendConnection(connection, JSON.stringify({ method: "setHost" }));
                    }

                    safeSendConnection(connection, JSON.stringify({
                        method: "lobbyJoined",
                        lobbyId: res.lobbyId,
                        isHost: lobby.host === clientId,
                    }));
                };

                tryJoinLobby(0);
            } 
            
        }

        if(res.method === "reset"){
            broadcastToLobby(curLobbyId,JSON.stringify({ method: 'reset'}));
        }

        if(res.method === "setUsername"){
            clientData.username = res.username;
            console.log(`Client ${clientId} set username: ${res.username}`);
            // console.log(clients);
        }

        if(res.method === "startGame"){

            
            if(curLobbyId != ""){
                let playerScoreMap = lobbies.get(curLobbyId).players.map((player) => ([clients.get(player).username, 0]));
                const payload = {
                    method: "loadGame",
                    playerScoreMap: playerScoreMap
                }

                
                let lobby = lobbies.get(curLobbyId);
                lobby.state = "inRound"
                for(player of lobby.players){
                    lobby.scoreMap.set(player, 0);
                }
                
                console.log("Sending loadGame signal");
                broadcastToLobby(curLobbyId, JSON.stringify(payload));
            }
            
        }

        if(res.method === "setCity"){
            let lobby = lobbies.get(curLobbyId);
            const payload = {
                method: "setCity",
                city: res.city,
                imageIds: res.imageIds,
                startingImageIdx: res.startingImageIdx,
                gameMode: lobby.gameMode,
                timeLimit: lobby.timeLimit,
            }
            broadcastToLobby(curLobbyId, JSON.stringify(payload));
        }

        if(res.method === "sendScore"){
            let lobby = lobbies.get(curLobbyId);
            let curRoundIdx = lobby.roundScores.length - 1;
            if(curLobbyId !== ""){
                if(!Array.isArray(lobby.roundScores[curRoundIdx])){
                    lobby.roundScores[curRoundIdx] = [];
                }
                if(!Array.isArray(lobby.roundLatLngs[curRoundIdx])){
                    lobby.roundLatLngs[curRoundIdx] = [];
                }

                const oldScore = lobby.scoreMap.get(clientId);
                const newScore = res.score + oldScore;
                lobby.scoreMap.set(clientId, newScore);
                lobby.guessesMade += 1;
                const username = clients.get(clientId).username;
                lobby.roundScores[curRoundIdx].push([username, res.score])
                lobby.roundLatLngs[curRoundIdx].push([username, [res.lat, res.lng]])
            }

            console.log(lobbies)


            let payload;

            if(lobby.guessesMade === lobby.players.length){
                console.log("ROUND DONE");
                

                let scores = [];

                for(player of lobby.players){
                    const username = clients.get(player).username;
                    const score = lobby.scoreMap.get(player);
                    scores.push([username, score]);
                }

                lobby.roundScores[curRoundIdx].sort((a, b) => (b[1] - a[1]));
                lobby.roundScores.push([]);
                lobby.roundLatLngs.push([]);

                scores.sort((a, b) => (b[1] - a[1]));

                console.log("CURRENT ROUND: " + lobby.curRound);
                if(lobby.curRound >= lobby.maxRounds){
                    console.log('Server reads game over');
                    const gameOverPayload = {
                        method: "gameOver",
                        clientId: clientId,
                        score: res.score,
                        scores: scores,
                        roundScores: lobby.roundScores[curRoundIdx],
                        roundLatLngs: lobby.roundLatLngs[curRoundIdx],
                    }
                    broadcastToLobby(curLobbyId, JSON.stringify(gameOverPayload));
                }
                lobby.curRound++;


                lobby.guessesMade = 0;
                payload = {
                    method: "finalGuessMade",
                    clientId: clientId,
                    score: res.score,
                    scores: scores,
                    roundScores: lobby.roundScores[curRoundIdx],
                    roundLatLngs: lobby.roundLatLngs[curRoundIdx],
                }
                console.log(lobby.roundScores);

            } else{
                console.log("ROUND CONTINUE");
                payload = {
                    method: "guessMade",
                    clientId: clientId,
                    score: res.score,
                }
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

    safeSendConnection(connection, JSON.stringify(payLoad));
});

module.exports = {
    CreateLobbyId,
    broadcastToLobby,
    httpServer,
    fetchMapillaryImageIds,
    getMapillaryCacheKey,
    mapillaryImageCache,
}