'use client';
import { useEffect, useState, JSX } from 'react';
import { useParams } from 'next/navigation';

import Game from "./Game";

export async function getImageIds(Lat: number, Lon: number): Promise<any> {

    const bbox_offset: number = 0.004

    //vancouver: Lon: -123.1207 Lat: 49.2827

    const minLon: number = Lon - bbox_offset;
    const maxLon: number = Lon + bbox_offset;

    const minLat: number = Lat - bbox_offset;
    const maxLat: number = Lat + bbox_offset;

    const bbox: string = minLon.toString() + "," + minLat.toString() + "," + maxLon.toString() + "," + maxLat.toString();
    const URL: string = 'https://graph.mapillary.com/images?' + 'access_token=' + process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN + '&fields=id&bbox=' + bbox;

    const res = await fetch(URL);

    return res.json()
}

function getRandomIdx(array_size: number): number {
    return Math.floor(Math.random() * array_size);
}

export default function Lobby() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>();
    const [state, setState] = useState<"noName" | "lobby" | "error" | "inGame">("noName");
    const [isHost, setIsHost] = useState<boolean>(false);
    const [scores, setScores] = useState<[[string, number]]>();
   

    //Map Use States

    const params = useParams();
    const lobbyId = params.lobbyId as string;

    interface imageID {
        id: string;
    };

    interface imageIdData {
        data: imageID[]
    }


    useEffect(() => {
        
        const ws = new WebSocket('ws://localhost:9090');
        setWs(ws);

        ws.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            ws.onopen = () => {
                console.log("WebSocket connected");
            };

            if (data.method === 'connect') {
                setClientId(data.clientId);
                console.log(clientId);
                ws.send(JSON.stringify({ method: 'connect', lobbyId: lobbyId, clientId: data.clientId }));
            }

            if (data.method === "setHost") {
                setIsHost(true);
                // rerollCity();
                //Might need to rethink this
                // ws.send(JSON.stringify({ method: 'setCity', city: chosenCity, clientId: data.clientId }));
            }

            if (data.method === "loadGame") {
                setScores(data.playerScoreMap);
                console.log(data.playerScoreMap);
                console.log(scores);
                setState("inGame");
            }

            if(data.method === "finalGuessMade"){
                setScores(data.scores);
                console.log(data.roundScores);
            }

        });


        return () => {
            ws.close();
        };
    }, []);

    function handleUsername(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;

        if (ws && username) ws.send(JSON.stringify({ method: 'setUsername', username: username }));

        setState("lobby");
    }

    function handleStartGame() {
        console.log("Starting Game!");
        if (ws) ws.send(JSON.stringify({ method: 'startGame' }));
    }

    return (
        <>
            {
                state === "noName" && (
                    <>
                        Test
                        <>
                            <form onSubmit={handleUsername}>
                                <label>
                                    Username: <input name="username" />
                                </label>
                                <button type="submit">Submit</button>
                            </form>
                        </>
                    </>
                )
            }

            {
                state === "lobby" && (
                    <>
                        Welcome to: {lobbyId}
                    </>
                )
            }

            {
                isHost && state === "lobby" && (
                    <div>
                        <button onClick={handleStartGame} >Start Game</button>
                    </div>
                )
            }

            {
                state === "inGame" && ws && (
                    <div>
                        <Game ws={ws} isHost={isHost}></Game>
                        {scores && (scores.length > 0) && (
                            <div className="scoreboard">
                                <h3 className="scoreboard-title">Scoreboard</h3>
                                <div className="scoreboard-header">
                                    <span className="scoreboard-col-left">Username</span>
                                    <span className="scoreboard-col-right">Score</span>
                                </div>
                                <ul className="scoreboard-list">
                                {scores.map(([username, score], idx) => (
                                    <li key={idx} className="scoreboard-item">
                                        <span className="scoreboard-username">{username}</span>
                                        <span className="scoreboard-score">{score}</span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                            )}
                    </div>
                )

                
            }


        </>
    );
}