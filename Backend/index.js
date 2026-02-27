const crypto = require("crypto");


const http = require("http");
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Server is listening on port 9090"));

const clients = new Map();

const wsServer = new websocketServer({
  httpServer: httpServer,
}); 


wsServer.on("request", (request) => {
    const connection = request.accept(null, request.origin);

    connection.on("close", () => {
        console.log("Connection closed");
    });

    connection.on("message", (message) => {
        const res = JSON.parse(message.utf8Data);

        console.log(res);
    });

    const clientId = crypto.randomUUID();


    const clientData = {
        connection: connection,
    };

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