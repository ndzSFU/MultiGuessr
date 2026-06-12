const crypto = require("crypto");
const express = require('express');
const cors = require('cors');

const http = require("http");
const websocketServer = require("websocket").server;

const allowedOrigins = [
        'https://multiguessr.vercel.app',
        'http://localhost:3000',
];

const api = express();
api.use(cors({
    origin: allowedOrigins,
  methods: ['GET','POST','OPTIONS'],
}));

api.options(/.*/, cors());
api.use(express.json());
const httpServer = http.createServer(api);

const wsServer = new websocketServer({
    httpServer: httpServer,
}); 


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
// lobbies.set(req.body.lobbyId, {maxPlayers: , maxRounds: , host: "", playerIDS: [], state: "lobby", scoreMap: , guessesMade: 0, roundScores: [[]]}});

//Note player and client are used synonymously, a list of playerIDS may contain clientId's clients == playerIDS

function getRandomIdx(array_size){
    return Math.floor(Math.random() * array_size);
}

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
async function fetchMapillaryImageIds(lat, lon, accessToken, bboxOffset = 0.003){
    

    const minLon = lon - bboxOffset;
    const maxLon = lon + bboxOffset;
    const minLat = lat - bboxOffset;
    const maxLat = lat + bboxOffset;

    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    let url = 'https://graph.mapillary.com/images?' +
        'access_token=' + accessToken +
        '&fields=id&bbox=' + bbox +
        '&limit=600';

    const retryMax = 9;
    let response = await fetch(url);
    let retryCount = 0;
    let bboxShrink = 0.00035
    let limmit = 300;

    while(!response.ok && retryCount < retryMax && bboxOffset > 0){
        console.log(`Mapillary fetch retry ${retryCount + 1} for ${lat}, ${lon}`);

        

        if(retryCount > 1){
            bboxOffset -= bboxShrink;

            const smaller_minLon = lon - bboxOffset;
            const samller_maxLon = lon + bboxOffset;
            const smaller_minLat = lat - bboxOffset;
            const samller_maxLat = lat + bboxOffset;

            let smaller_bbox = `${smaller_minLon},${smaller_minLat},${samller_maxLon},${samller_maxLat}`;
            url = 'https://graph.mapillary.com/images?' +
            'access_token=' + accessToken +
            '&fields=id&bbox=' + smaller_bbox +
            '&limit=' + limmit;
            console.log("shrunk bbox to: " + bboxOffset);
            
            limmit = 200

            if(retryCount > 5){
                limmit = 100;
                console.log("Shrinking limmit to 100");
            }else{
                console.log("Shrinking limmit to 200");
            }
        }
        

        response = await fetch(url);
        retryCount++;
    }

    // console.log(response);

    if(!response.ok){
        const body = await response.text();
        console.log("Response status: " + response.status);
        console.log("Response text: " + body);
        throw new Error(`Mapillary request failed after ${retryCount} attempts`);
    }

    const payload = await response.json();

    console.log(payload);
    if(!Array.isArray(payload?.data)){
        console.error('Mapillary payload shape unexpected', { url, status: response.status, payload });
        throw new Error('Mapillary response did not contain image data');
    }

    if(Array(payload?.data).length < 1){
        throw new Error('Mapillary response array had 0 image ids');
    }

    return payload.data.map((entry) => entry.id).filter(Boolean);
}

api.get('/api/mapillary-images', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const accessToken = process.env.MAPILLARY_ACCESS_TOKEN;

    console.log("Going to grab an imageID")

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        console.log("lat " + lat);
        console.log("lon " + lon);
        res.status(400).json({ message: 'Invalid lat/lon' });
        return;
    }

    if (!accessToken) {
        res.status(500).json({ message: 'Missing MAPILLARY_ACCESS_TOKEN' });
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

    //Score stores total scores
    lobbies.set(req.body.lobbyId, {gameMode: req.body.gameMode, timeLimit: req.body.timeLimit, maxPlayers: req.body.maxPlayers, maxRounds: req.body.maxRounds, curRound: 1, host: "",
                                   playerIDS: [], state: "lobby", scoreMap: new Map(), guessesMade: 0, roundScores: [[]], roundLatLngs: [[]], team1: [], team2: [], team1HP: req.body.HP, 
                                   team2HP: req.body.HP, region: req.body.region, multiplierMode: req.body.multiplierMode, damageMultiplierIncrement: parseFloat(req.body.multiplierIncrement), 
                                   team1DamageMultiplier: 1, team2DamageMultiplier: 1, });
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

api.post('/api/validateLobbyId', (req, res) => {
    res.json(Boolean(lobbies.has(req.body.lobbyId)));
})


function roundToDecimals(num, decimals = 2) {
    return Number(Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

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

    if(lobby.playerIDS !== undefined) {
         lobby.playerIDS = lobby.playerIDS.filter((playerId) => safeSendToClient(playerId, stringifiedMessage, clientsMap));
    } else{
        console.log("Player ids not defined, broadcast not made!!!")
    }
}

// Probably don't need anymore? 
// function broadcastToLobbyFromHost(lobbyId, stringifiedMessage){
//     let lobby = lobbies.get(lobbyId);
//     for(const clientID of lobby.playerIDS){
//         if(clientID !== lobby.host)
//         clients.get(clientID).connection.send(stringifiedMessage);
        
//     }
// }

//Removes the username if it exists
function removeFromTeam(team, username){
    if(team.indexOf(username) !== -1){
        team.splice(team.indexOf(username), 1);
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
        const departingUsername = clientData.username;

        // Remove from lobby if they were in one
        if (curLobbyId) {
            const lobby = lobbies.get(curLobbyId);

            if (lobby) {
                // Remove player from playerIDS array
                lobby.playerIDS = lobby.playerIDS.filter(id => id !== clientId);
                
                // Remove from scoreMap
                lobby.scoreMap.delete(clientId);

                const remainingUsernames = lobby.playerIDS
                    .map((id) => clients.get(id)?.username)
                    .filter((username) => typeof username === "string" && username.length > 0);
                
                // If they were host, assign new host (or delete lobby if empty)
                if (lobby.host === clientId) {
                    if (lobby.playerIDS.length > 0) {
                        lobby.host = lobby.playerIDS[0];
                        safeSendToClient(lobby.host, JSON.stringify({ method: "setHost" }));
                    } else {
                        // No playerIDS left, delete the lobby
                        lobbies.delete(curLobbyId);
                    }
                }

                removeFromTeam(lobby.team1, departingUsername);
                removeFromTeam(lobby.team2, departingUsername);

                console.log("Remaining Usernames: ", remainingUsernames);

                if (lobby.playerIDS.length > 0) {
                    broadcastToLobby(curLobbyId, JSON.stringify({
                        method: "playerLeft",
                        clientId,
                        username: departingUsername,
                        remainingUsernames,
                        hostId: lobby.host,
                    }));
                    broadcastToLobby(curLobbyId, JSON.stringify({
                        method: "updateTeams",
                        team1: lobby.team1,
                        team2: lobby.team2,
                    }));
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
        const getLobby = (lobbyId = curLobbyId) => {
            if(!lobbyId){
                return undefined;
            }
            return lobbies.get(lobbyId);
        };

        let lobby = getLobby();

        function sendUpdatedUsernames(){
            if(!lobby){
                return;
            }

            const usernames = lobby.playerIDS.map((clientID) => {
                console.log(clients.get(clientID));
                console.log(clients);
                console.log("Client id: " + clientID);
                return clients.get(clientID).username;
            })

            
            broadcastToLobby(curLobbyId, JSON.stringify(
                { 
                    method: 'updatePlayers',
                    takenUsernames: usernames,
                }
            ));
        }

        if(res.method === "connect"){
            if(res.clientId === clientId){
                const tryJoinLobby = (attempt) => {
                    lobby = getLobby(res.lobbyId);

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
                    lobby = getLobby();

                    if(!lobby.playerIDS.includes(res.clientId)){
                        lobby.playerIDS.push(res.clientId);
                    }

                    if(lobby.playerIDS.length === 1 || lobby.host === '' || lobby.host === clientId){
                        console.log("First Connection");
                        lobby.host = clientId;
                        safeSendConnection(connection, JSON.stringify({ method: "setHost" }));
                    }



                    safeSendConnection(connection, JSON.stringify({
                        method: "lobbyJoined",
                        lobbyId: res.lobbyId,
                        isHost: lobby.host === clientId,
                        gameMode: lobby.gameMode,
                    }));

                    sendUpdatedUsernames();
                    broadcastToLobby(curLobbyId, JSON.stringify({method: "updateTeams", team1: lobby.team1, team2: lobby.team2}));
                };

                tryJoinLobby(0);
            } 
            
        }

        if(res.method === "reset"){
            broadcastToLobby(curLobbyId, JSON.stringify({ method: 'reset'}));
        }

        if(res.method === "setUsername"){
            clientData.username = res.username;
            lobby = getLobby();
            if(!lobby){
                return;
            }

            console.log(`Client ${clientId} set username: ${res.username}`);

            sendUpdatedUsernames();
            // console.log(clients);
        }

        if(res.method === "startGame"){
            lobby = getLobby();
            
            if(curLobbyId != "" && lobby){
                let playerScoreMap = lobby.playerIDS.map((player) => ([clients.get(player).username, 0]));
                const payload = {
                    method: "loadGame",
                    playerScoreMap: playerScoreMap,
                    team1HP: lobby.team1HP,
                    team2HP: lobby.team2HP,
                    multiplierMode: lobby.multiplierMode,
                    region: lobby.region,
                    maxRounds: lobby.maxRounds,
                }

                console.log("MultiMode: " + lobby.multiplierMode);

                
                
                lobby.state = "inRound"
                for(player of lobby.playerIDS){
                    lobby.scoreMap.set(player, 0);
                }
                
                console.log("Sending loadGame signal");
                broadcastToLobby(curLobbyId, JSON.stringify(payload));
            }
            
        }

        if(res.method === "setCity"){
            lobby = getLobby();
            if(!lobby){
                return;
            }
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
            lobby = getLobby();
            if(!lobby){
                return;
            }
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

            if(lobby.guessesMade === lobby.playerIDS.length){
                console.log("ROUND DONE");
                

                let totalScores = [];

                for(player of lobby.playerIDS){
                    const username = clients.get(player).username;
                    const score = lobby.scoreMap.get(player);
                    totalScores.push([username, score]);
                }

                lobby.roundScores[curRoundIdx].sort((a, b) => (b[1] - a[1]));
                lobby.roundScores.push([]);
                lobby.roundLatLngs.push([]);

                totalScores.sort((a, b) => (b[1] - a[1]));

                console.log("CURRENT ROUND: " + lobby.curRound);
                if(lobby.curRound >= lobby.maxRounds){
                    console.log('Server reads game over');
                    const gameOverPayload = {
                        method: "gameOver",
                        clientId: clientId,
                        score: res.score,
                        scores: totalScores,
                        roundScores: lobby.roundScores[curRoundIdx],
                        roundLatLngs: lobby.roundLatLngs[curRoundIdx],
                        allRoundScores: lobby.roundScores,
                        allRoundLatLngs: lobby.roundLatLngs,
                    }
                    broadcastToLobby(curLobbyId, JSON.stringify(gameOverPayload));
                }
                lobby.curRound++;

                // Maybe should have if else for this and the above payload
                lobby.guessesMade = 0;

                if(lobby.gameMode === "knockout"){
                    let team1Max = -1;
                    let team2Max = -1;
                    let team1Scorer = ""
                    let team2Scorer = ""
                    for(const score of lobby.roundScores[curRoundIdx]){
                        if(lobby.team1.includes(score[0])){
                            // Each set of user_and_score is stored as [[username, score], ... ]
                            // so user_and_score[0] is the username and [1] is the score
                            team1Scorer = score[0]
                            if(score[1] > team1Max){
                                team1Max = score[1];
                            }
                        }else{
                            team2Scorer = score[0]
                            if(score[1] > team2Max){
                                team2Max = score[1];
                            }
                        }

                        console.log("Looking at: " + score)

                        if(team1Max > -1 && team2Max > -1) break;
                    }
                    let winner = ""
                    let damage = 0;
                    let loserOldHp = 0;
                    

                    if(team1Max === team2Max){
                        winner = "tie";
                    } else if(team1Max > team2Max){

                        damage = (team1Max - team2Max) * lobby.team1DamageMultiplier;
                        loserOldHp = lobby.team2HP;
                        lobby.team2HP -= Math.round(damage);
                        winner = "team1";
                    }else {
                        damage = (team2Max - team1Max) * lobby.team2DamageMultiplier;
                        loserOldHp = lobby.team1HP;
                        lobby.team1HP -= Math.round(damage);
                        winner = "team2";
                    }

                    let prevTeam1DamageMultiplier = lobby.team1DamageMultiplier;
                    let prevTeam2DamageMultiplier = lobby.team2DamageMultiplier;

                    if(lobby.multiplierMode === "winnerGetsMultiplier"){
                        if(winner === "team1"){
                            lobby.team1DamageMultiplier += lobby.damageMultiplierIncrement;
                        } else if (winner === "team2"){
                            lobby.team2DamageMultiplier += lobby.damageMultiplierIncrement;
                        }
                    else if(lobby.multiplierMode === "loserGetsMultiplier"){
                        if(winner === "team2"){
                            lobby.team1DamageMultiplier += lobby.damageMultiplierIncrement;
                        } else if (winner === "team1"){
                            lobby.team2DamageMultiplier += lobby.damageMultiplierIncrement;
                        }
                    }
                    }else{
                        //Per round dmg mult, inc both
                        lobby.team1DamageMultiplier += lobby.damageMultiplierIncrement;
                        lobby.team2DamageMultiplier += lobby.damageMultiplierIncrement;
                    }

                    if(lobby.team1HP <= 0 || lobby.team2HP <= 0){
                        console.log('Server reads game over');
                        const gameOverPayload = {
                            method: "gameOver",
                            clientId: clientId,
                            allRoundScores: lobby.roundScores,
                            allRoundLatLngs: lobby.roundLatLngs,
                            winner: lobby.team1HP > lobby.team2HP ? "team1" : "team2",
                        }
                        console.log(lobby.roundLatLngs);
                        console.log(lobby.roundScores);
                        broadcastToLobby(curLobbyId, JSON.stringify(gameOverPayload));
                    }

                    payload = {
                        method: "finalGuessMade",
                        clientId: clientId,
                        score: res.score,
                        scores: totalScores,
                        roundScores: lobby.roundScores[curRoundIdx],
                        roundLatLngs: lobby.roundLatLngs[curRoundIdx],
                        team1Max,
                        team2Max,
                        loserOldHp,
                        team1HP: lobby.team1HP,
                        team2HP: lobby.team2HP,
                        team1Scorer,
                        team2Scorer,
                        team1DamageMultiplier: roundToDecimals(lobby.team1DamageMultiplier),
                        team2DamageMultiplier: roundToDecimals(lobby.team2DamageMultiplier),
                        damage,
                        prevTeam1DamageMultiplier,
                        prevTeam2DamageMultiplier,
                    }
                } else{
                    payload = {
                        method: "finalGuessMade",
                        clientId: clientId,
                        score: res.score,
                        scores: totalScores,
                        roundScores: lobby.roundScores[curRoundIdx],
                        roundLatLngs: lobby.roundLatLngs[curRoundIdx],
                    }
                }
                //res.score is the incomming score from the user just made last round
                
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

        function handleJoinTeam(teamToJoin){
            lobby = getLobby();
            if(!lobby){
                return;
            }
            let team1 = lobby.team1;
            let team2 = lobby.team2;
            let username = clientData.username

            if(teamToJoin === "team1"){

                if(team1.includes(username)){
                    return;
                }

                if(team2.includes(username)){
                    removeFromTeam(team2, username);
                } 

                
                team1.push(username);
                
            } else if(teamToJoin === "team2"){

                if(team2.includes(username)){
                    return;
                }

                if(team1.includes(username)){
                    removeFromTeam(team1, username);
                } 

                team2.push(username);
            }

            broadcastToLobby(curLobbyId, JSON.stringify({method: "updateTeams", team1: lobby.team1, team2: lobby.team2}));
        }

        if(res.method === "joinTeam1"){
            handleJoinTeam("team1");
        }

        if(res.method === "joinTeam2"){
            handleJoinTeam("team2");
        }
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