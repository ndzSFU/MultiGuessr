'use client';
import { useEffect, useState, JSX } from 'react';
import { useParams } from 'next/navigation';

import Game from "./Game";

export async function getImageIds(Lat: number, Lon: number): Promise<any> {

    const bbox_offset: number = 0.001

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
    const [showRoundScores, setShowRoundScores] = useState<boolean>(false);
    const [roundScores, setRoundScores] = useState<[[string, number]] | null>(null);
   

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
                setShowRoundScores(true);
                setRoundScores(data.roundScores);
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
                showRoundScores && roundScores !== null && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        padding: '2rem 2.5rem 1.5rem 2.5rem',
                        zIndex: 10000,
                        minWidth: '320px',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <button
                            onClick={() => setShowRoundScores(false)}
                            style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.25rem',
                                color: '#ef4444', // Tailwind red-500
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h3 style={{ color: '#040405', marginBottom: '1rem', fontWeight: 600, fontSize: '1.2rem' }}>Round Score Changes</h3>
                        <div style={{ width: '100%' }}>
                            {Array.isArray(roundScores) && roundScores.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {roundScores.map(([username, score], idx) => (
                                        <li key={username + idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem',
                                            fontSize: '1rem',
                                        }}>
                                            <span style={{ color: '#040405', fontWeight: 500 }}>{username}</span>
                                            <span style={{ color: score > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                                                {score > 0 ? '+' : ''}{score}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ color: '#040405', textAlign: 'center' }}>No score changes this round.</div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                state === "inGame" && ws && (
                    <div>
                        <Game ws={ws} isHost={isHost} setShowRoundScores={setShowRoundScores}></Game>
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