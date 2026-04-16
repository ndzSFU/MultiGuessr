'use client';
import { useEffect, useState, JSX } from 'react';
import { useParams } from 'next/navigation';

import Game from "./Game";

function getRandomIdx(array_size: number): number {
    return Math.floor(Math.random() * array_size);
}

export default function Lobby() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [state, setState] = useState<"noName" | "lobby" | "error" | "inGame">("noName");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [scores, setScores] = useState<[[string, number]]>();
    const [showRoundScores, setShowRoundScores] = useState<boolean>(false);
    const [roundScores, setRoundScores] = useState<[[string, number]] | null>(null);
    const [gameMode, setGameMode] = useState<"setRounds" | "knockout" | "timerTrigger">("setRounds");
    const [usernames, setusernames] = useState<[string]>([""]);
   

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
        const socket = new WebSocket('ws://localhost:9090');
        setWs(socket);

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.method === 'connect') {
                setClientId(data.clientId);
                socket.send(JSON.stringify({ method: 'connect', lobbyId: lobbyId, clientId: data.clientId }));
            }

            if (data.method === 'lobbyJoined') {
                setIsHost(Boolean(data.isHost));
                setGameMode(data.gameMode);
                console.log(usernames);
            }

            if (data.method === "setHost") {
                console.log("Your the host!");
                setIsHost(true);
            }

            if (data.method === "loadGame") {
                setScores(data.playerScoreMap);
                console.log(data.playerScoreMap);
                setState("inGame");
                console.log("Loading Game!");
            }

            if(data.method === "finalGuessMade"){
                setScores(data.scores);
                console.log(data.roundScores);
                setShowRoundScores(true);
                setRoundScores(data.roundScores);
            }

            if(data.method === "playerLeft"){
                setusernames(data.remainingUsernames);
            }

            if(data.method === "updatePlayers"){
                setusernames(data.takenUsernames);
            }
        };

        socket.addEventListener("message", handleMessage);

        return () => {
            socket.removeEventListener("message", handleMessage);
            socket.close();
        };
    }, [lobbyId]);

    function handleUsername(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = ((formData.get('username') as string) ?? "").trim();
        if(username.length < 1){
            setUsernameError("Username must be at least 1 character long.");
        }else if(usernames.includes(username)){
            setUsernameError("Name already in use in this lobby.");
        } else{
            setUsernameError(null);
            if (ws && username) ws.send(JSON.stringify({ method: 'setUsername', username: username }));
            setState("lobby");
        }

        
    }

    function handleStartGame() {
        console.log("Starting Game!");
        if (ws) ws.send(JSON.stringify({ method: 'startGame' }));
    }

    function handleJoinTeam1(){
        if (ws) ws.send(JSON.stringify({ method: 'joinTeam1' }));
    }

    function handleJoinTeam2(){
        if (ws) ws.send(JSON.stringify({ method: 'joinTeam2' }));
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
                                {usernameError && (
                                    <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{usernameError}</p>
                                )}
                            </form>
                        </>
                    </>
                )
            }

            {
                state === "lobby" && (
                    <>
                        Welcome to lobby: {lobbyId}

                        {
                            usernames.map((username) =>{
                                return (
                                <div>
                                    {username}
                                </div>
                                )
                            })
                        }

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
                gameMode === "knockout" && state === "lobby" && (
                    <>
                        <form onSubmit={handleJoinTeam1}>
        
                            <button type="submit">Join Team 1</button>
                        </form>

                        <form onSubmit={handleJoinTeam2}>
        
                            <button type="submit">Join Team 2</button>
                        </form>
                     </>
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
                        <Game ws={ws} isHost={isHost} setShowRoundScores={setShowRoundScores} gameMode={gameMode} showRoundScores={showRoundScores}></Game>
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