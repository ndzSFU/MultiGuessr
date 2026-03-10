First Commit already has all of this because I accidently pushed all the other stuff into a repo on my school github whoops.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Architecture:
1. Clients Goes to Create a Lobby, request a unique Lobby ID from the server via a GET request. 
2. Server returns the lobby ID to client, once received on client end, the client will dispaly the lobby UI.
3. A web socket connection is then established with the server and the client passed it's lobby id to the server
4. the server will create a client id for the user and link it to the lobby id given by the user.
5. Server sends the client id back to the client for future use.
6. Repeat steps 4 and 5 for every subsequent user, the client id is dispaly on the lobby UI and the creator of the lobby is expected to pass that lobby id to his friends so they can pass it to the server after connecting.

7. The states of both clients and lobbys are maintained by 2 hashmaps one for clients and one for lobbies, values of the hashmaps are regualrly updated at each step

Clients map: Maps CID to the webscoekt connect and the username
Lobbies Map: Maps LID to the lobby settings and a list of players CID who are currently connected

Web Socket message ordering:
1. Upon establish of the TCP connection, the server sends a "connect" message to the client with its clientID
2. The client the sends a "connect" message back to server telling the server its lobby id.
3. If the client is the first client joining then the server will send a "setHost" message to the client denoting it as the host.
4. When the host clicks start game, that client will send a "startGame" message to server
5. Upon receival of the "startGame" message the server will broadcast this message to all clients in the lobby (The lost of which is stored in the lobby Map).
6. When all clients received the "startGame" message from the server the game renders.
7. After each client makes a guess, a "sendScore" message is sent to the server, server respond with a regular "guessMade" response until the final guess is made
8. The server stores a counter tracking how many guess are made and when all clients have guessed (or when timer runs out) it broadcasts a "finalGuessMade" message and send the updated scores to each client to display