'use client';
import { useEffect, useState, JSX } from 'react';
import { useParams } from 'next/navigation';

import Game from "./Game";
import HPBar from "./HPBar";

function getRandomIdx(array_size: number): number {
    return Math.floor(Math.random() * array_size);
}

export default function Lobby() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [state, setState] = useState<"noName" | "lobby" | "error" | "inGame" | "gameOver">("noName");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [scores, setScores] = useState<[[string, number]]>();
    const [showRoundScores, setShowRoundScores] = useState<boolean>(false);
    const [roundScores, setRoundScores] = useState<[[string, number]] | null>(null);
    const [gameMode, setGameMode] = useState<"setRounds" | "knockout" | "timerTrigger">("setRounds");
    const [usernames, setusernames] = useState<[string] | null>(null);
    const [team1, setTeam1] = useState<[string] | [] >([]);
    const [team2, setTeam2] = useState<[string] | [] >([]);
    const [curTeam1HP, setCurTeam1HP] = useState<number | null>(null);
    const [maxTeam1HP, setMaxTeam1HP] = useState<number | null>(null);
    const [curTeam2HP, setCurTeam2HP] = useState<number | null>(null);
    const [maxTeam2HP, setMaxTeam2HP] = useState<number | null>(null);
    const [team1MaxDamage, setTeam1MaxDamage] = useState<number | null>(null);
    const [team2MaxDamage, setTeam2MaxDamage] = useState<number | null>(null);
    const [winner, setWinner] = useState<string| null>(null);
    const [resultsRequested, setResultsRequested] = useState<boolean>(false);
    const [team1DamageMultiplier, setTeam1DamageMultiplier] = useState<string>("1");
    const [team2DamageMultiplier, setTeam2DamageMultiplier] = useState<string>("1");
    const [multiplierMode, setMultiplierMode] = useState<string | null>(null);
    const [region, setRegion] = useState<string>("world");
    const [showScoreCalculations, setShowScoreCalculations] = useState<Boolean>(false);

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
                console.log("Backend sent multiplierMode:", data.multiplierMode);
                console.log("TESTSTST")
                setCurTeam1HP(parseInt(data.team1HP, 10));
                setMaxTeam1HP(parseInt(data.team1HP, 10));
                setCurTeam2HP(parseInt(data.team2HP, 10));
                setMaxTeam2HP(parseInt(data.team2HP, 10));
                if(data.multiplierMode !== undefined){
                    setMultiplierMode(data.multiplierMode);
                    console.log("Set multiplierMode to:", data.multiplierMode);
                } else {
                    console.log("WARNING: multiplierMode is undefined from backend");
                }
                setRegion(data.region);
            }

            if(data.method === "finalGuessMade"){
                setScores(data.scores);
                console.log(data.roundScores);
                setShowRoundScores(true);
                setRoundScores(data.roundScores);

                if(data.team1HP !== undefined && data.team2HP !== undefined && data.team1Max !== undefined && data.team2Max !== undefined){
                    console.log("Damage dealt!")
                    console.log("Received multipliers:", { team1: data.team1DamageMultiplier, team2: data.team2DamageMultiplier });
                    setCurTeam1HP(parseInt(data.team1HP, 10));
                    setCurTeam2HP(parseInt(data.team2HP, 10));
                    setTeam1MaxDamage(parseInt(data.team1Max, 10));
                    setTeam2MaxDamage(parseInt(data.team2Max, 10));
                    setTeam1DamageMultiplier(data.team1DamageMultiplier);
                    setTeam2DamageMultiplier(data.team2DamageMultiplier);
                    setShowScoreCalculations(true);
                }
            }

            if(data.method === "playerLeft"){
                setusernames(data.remainingUsernames);
            }

            if(data.method === "updatePlayers"){
                setusernames(data.takenUsernames);
            }

            if(data.method === "updateTeams"){
                console.log(data.team1);
                console.log(data.team2);
                setTeam1(data.team1);
                setTeam2(data.team2);                
            }
            
            if(data.method === "gameOver"){
                // setState("gameOver");
                setWinner(data.winner);
            }
        };

        socket.addEventListener("message", handleMessage);

        return () => {
            socket.removeEventListener("message", handleMessage);
            socket.close();
        };
    }, [lobbyId]);

    useEffect(() => {
        console.log("Multiplier state updated:", {
            multiplierMode: multiplierMode,
            team1DamageMultiplier: team1DamageMultiplier,
            team2DamageMultiplier: team2DamageMultiplier,
        });
    }, [multiplierMode, team1DamageMultiplier, team2DamageMultiplier]);

    function handleUsername(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = ((formData.get('username') as string) ?? "").trim();
        if(username.length < 1){
            setUsernameError("Username must be at least 1 character long.");
        }else if(usernames?.includes(username)){
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
                            usernames?.map((username) =>{
                                return (
                                    <div key={username}>
                                        {username}
                                    </div>
                                )
                            })
                        }

                        {
                            team1 && team2 && (
                                <>
                                    <div>
                                        Team1
                                        {
                                            team1?.map((username) =>{
                                                return (
                                                <div key={username}>
                                                    {username}
                                                </div>
                                                )
                                            })
                                        }
                                    </div>

                                    <div>
                                        Team2
                                        {
                                            team2?.map((username) =>{
                                                return (
                                                <div key={username}>
                                                    {username}
                                                </div>
                                                )
                                            })
                                        }
                                    </div>

                                </>
                            )
                        }

                    </>
                )
            }

            {
                isHost && state === "lobby" && (gameMode !== "knockout" || (team1.length > 0 && team2.length > 0)) && (
                    <div>
                        <button onClick={handleStartGame} >Start Game</button>
                    </div>
                )
            }

            {
                gameMode === "knockout" && state === "lobby" && (
                    <>
                        <button type="button" onClick={handleJoinTeam1}>Join Team 1</button>
                        <button type="button" onClick={handleJoinTeam2}>Join Team 2</button>
                     </>
                )
            }

            {
                showRoundScores && roundScores !== null && gameMode !== "knockout" && (
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
                        <Game 
                            ws={ws} isHost={isHost} setShowRoundScores={setShowRoundScores} gameMode={gameMode} 
                            showRoundScores={showRoundScores} setResultsRequested={setResultsRequested} setState={setState} 
                            region={region} setShowScoreCalculations={setShowScoreCalculations}>

                        </Game>
                    </div>
                )                
            }

            {
                 state === "inGame" && gameMode === "knockout" && (
                    <div>
                        {multiplierMode === "everyRoundIncrement" && (
                                <div style={{
                                    position: 'fixed',
                                    top: '12%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '9999px',
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    color: 'white',
                                    fontWeight: "bold",
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                                    zIndex: 99999,
                                }}>
                                    {team1DamageMultiplier !== null ? `x${team1DamageMultiplier}` : 'x1'}
                                </div>
                        )}
                    </div>
                 )
            }

            {
                state === "inGame" && ws && (
                    <div>
                        {/* All other modes besides knockout */}
                        {scores && (scores.length > 0) && gameMode !== "knockout" && (
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
                            ) 
                        
                        }
                    </div>
                )                
            }

            {
                state === "inGame" && gameMode === "knockout" && curTeam1HP !== null && maxTeam1HP !== null && curTeam2HP !== null && maxTeam2HP !== null && (
                    <div>
                        <HPBar
                            label="Team 1"
                            hp={curTeam1HP}
                            maxHp={maxTeam1HP}
                            position="left"
                        />
                        {
                            multiplierMode === "winnerGetsMultiplier" && (
                                <div style={{
                                    position: 'fixed',
                                    top: '9%',
                                    left: '77%',
                                    display: "flex",
                                    width: '44px', 
                                    height: '30px',
                                    transform: 'translate(-50%, -50%)',
                                    padding: '0.55rem 1.05rem',
                                    borderRadius: '9999px',
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    color: 'white',
                                    fontWeight: "bold",
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                                    alignItems: "center",
                                    justifyContent: 'center',
                                    zIndex: 99999,
                                }}>
                                    {team2DamageMultiplier !== null ? `x${team2DamageMultiplier}` : 'x1'}
                                </div>
                            )
                        }
                        <HPBar
                            label="Team 2"
                            hp={curTeam2HP}
                            maxHp={maxTeam2HP}
                            position="right"
                        />

                        {
                            multiplierMode === "winnerGetsMultiplier" && (
                                <div style={{
                                    position: 'fixed',
                                    top: '9%',
                                    left: '23%',
                                    display: "flex",
                                    width: '44px', 
                                    height: '30px',
                                    transform: 'translate(-50%, -50%)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '9999px',
                                    background: 'rgba(15, 23, 42, 0.85)',
                                    color: 'white',
                                    fontWeight: "bold",
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                                    alignItems: "center",
                                    justifyContent: 'center',
                                    zIndex: 99999,
                                }}>
                                    {team1DamageMultiplier !== null ? `x${team1DamageMultiplier}` : 'x1'}
                                </div>
                            )
                        }
                    </div>  
                )                
            }

            {
                state === "inGame" && gameMode === "knockout" && showScoreCalculations && (
                    <div>
                        <div style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'white',
                            zIndex: 99999,
                        }}>
                            HELp
                        </div>
                    </div>
                )
            }


            {
                resultsRequested && (
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
                        color: "black",
                    }}>
                        {
                            winner === "team1" ? (
                                <div>
                                    Congrats Team1
                                </div>
                            ) : (
                                <div>
                                    Congrats Team2
                                </div>
                            )
                        }
                   </div>
                )
            }
            


        </>
    );
}