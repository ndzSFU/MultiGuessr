'use client';
import { useEffect, useState, JSX } from 'react';
import { useParams } from 'next/navigation';

import Game from "./Game";
import HPBar from "./HPBar";
import MultiplierContainer from './MultiplierContainer';
import type { CSSProperties } from 'react';

function getRandomIdx(array_size: number): number {
    return Math.floor(Math.random() * array_size);
}

function calculateNetDamage(team1Damage: number, team2Damage: number): number {
    if (team2Damage > team1Damage) {
        return team2Damage - team1Damage;
    } else {
        return team1Damage - team2Damage; 
    }
}

export default function Lobby() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [state, setState] = useState<"noName" | "lobby" | "error" | "inGame" | "gameOver" | "results">("noName");
    const [usernameErrorMsg, setUsernameErrorMsg] = useState<string | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [totalScores, setTotalScores] = useState<[[string, number]]>();
    const [showRoundScores, setShowRoundScores] = useState<boolean>(false);
    const [currRoundScores, setCurrRoundScores] = useState<[[string, number]] | null>(null);
    const [gameMode, setGameMode] = useState<"setRounds" | "knockout" | "timerTrigger">("setRounds");
    const [playerList, setPlayerList] = useState<[string] | null>(null);
    const [team1, setTeam1] = useState<string[]>([]);
    const [team2, setTeam2] = useState<string[]>([]);
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
    const [loserOldHp, setLoserOldHp] = useState<string | null>(null);
    const [prevTeam1DamageMultiplier, setPrevTeam1DamageMultiplier] = useState<string>("1");
    const [prevTeam2DamageMultiplier, setPrevTeam2DamageMultiplier] = useState<string>("1");
    // Animation states for sequential reveal of damage calculations
    const [showTeam1CalcAnim, setShowTeam1CalcAnim] = useState<boolean>(false);
    const [showTeam2CalcAnim, setShowTeam2CalcAnim] = useState<boolean>(false);
    const [showResultAnim, setShowResultAnim] = useState<boolean>(false);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [allRoundScores, setAllRoundScores] = useState<[[[string, number]]] | null>(null);


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
                console.log(playerList);
            }

            if (data.method === "setHost") {
                console.log("Your the host!");
                setIsHost(true);
            }

            if (data.method === "loadGame") {
                setTotalScores(data.playerScoreMap);
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
                setTotalScores(data.scores);
                console.log(data.roundScores);
                setShowRoundScores(true);
                setCurrRoundScores(data.roundScores);

                if(data.team1HP !== undefined && data.team2HP !== undefined && data.team1Max !== undefined && data.team2Max !== undefined){
                    setPrevTeam1DamageMultiplier(data.prevTeam1DamageMultiplier);
                    setPrevTeam2DamageMultiplier(data.prevTeam2DamageMultiplier);
                    console.log("Damage dealt!")
                    console.log("Received multipliers:", { team1: data.team1DamageMultiplier, team2: data.team2DamageMultiplier });
                    setCurTeam1HP(parseInt(data.team1HP, 10));
                    setCurTeam2HP(parseInt(data.team2HP, 10));
                    setTeam1MaxDamage(parseInt(data.team1Max, 10));
                    setTeam2MaxDamage(parseInt(data.team2Max, 10));
                    setTeam1DamageMultiplier(data.team1DamageMultiplier);
                    setTeam2DamageMultiplier(data.team2DamageMultiplier);
                    setLoserOldHp(data.loserOldHp);
                    
                    
                    setShowScoreCalculations(true);
                }
            }

            if(data.method === "playerLeft"){
                setPlayerList(data.remainingUsernames);
            }

            if(data.method === "updatePlayers"){
                setPlayerList(data.takenUsernames);
            }

            if(data.method === "updateTeams"){
                console.log(data.team1);
                console.log(data.team2);
                setTeam1(data.team1);
                setTeam2(data.team2);                
            }
            
            if(data.method === "gameOver"){
                setWinner(data.winner);
                setAllRoundScores(data.allRoundScores);
                setState("gameOver");
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

    // Sequence animation when the score-calculation modal is shown
    useEffect(() => {
        let t1: ReturnType<typeof setTimeout> | null = null;
        let t2: ReturnType<typeof setTimeout> | null = null;
        let t3: ReturnType<typeof setTimeout> | null = null;

        if (showScoreCalculations) {
            // reset
            setShowTeam1CalcAnim(false);
            setShowTeam2CalcAnim(false);
            setShowResultAnim(false);

            // staggered reveal
            t1 = setTimeout(() => setShowTeam1CalcAnim(true), 220);
            t2 = setTimeout(() => setShowTeam2CalcAnim(true), 620);
            t3 = setTimeout(() => setShowResultAnim(true), 1020);
        } else {
            setShowTeam1CalcAnim(false);
            setShowTeam2CalcAnim(false);
            setShowResultAnim(false);
        }

        return () => {
            if (t1) clearTimeout(t1);
            if (t2) clearTimeout(t2);
            if (t3) clearTimeout(t3);
        };
    }, [showScoreCalculations, prevTeam1DamageMultiplier, prevTeam2DamageMultiplier, team1MaxDamage, team2MaxDamage]);

    function handleUsername(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = ((formData.get('username') as string) ?? "").trim();
        if(username.length < 1){
            setUsernameErrorMsg("Username must be at least 1 character long.");
        }else if(playerList?.includes(username)){
            setUsernameErrorMsg("Name already in use in this lobby.");
        } else{
            setUsernameErrorMsg(null);
            if (ws && username) ws.send(JSON.stringify({ method: 'setUsername', username: username }));
            setCurrentUsername(username);
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

    const knockoutStylePlayerList: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
    const noTeamsStylePlayerList: CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
    };

    return (
        <>
            {
                state === "noName" && (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: "url('/main_menu_background.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}>
                        <div style={{
                            width: 720,
                            maxWidth: '92%',
                            padding: '2.5rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.9)',
                            boxShadow: '0 10px 30px rgba(2,6,23,0.35)',
                            backdropFilter: 'blur(6px)',
                            alignItems: 'center',
                            
                        }}>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.6px', color: '#0b1220' }}>What should we call you?</h1>
                            <form onSubmit={handleUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.8rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input name="username" placeholder="Enter your username" style={{ width: '100%', height: '40px', boxSizing: 'border-box', borderRadius: 6, fontSize: '1rem', padding: '0.5rem', border: '1px solid #e5e7eb', fontFamily: 'inherit' }} />
                                </label>
                                <button type="submit" style={{ height: '40px', borderRadius: 8, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Enter Lobby</button>
                                {usernameErrorMsg && (
                                    <p style={{ color: '#dc2626', marginTop: '0.5rem', fontWeight: 500, textAlign: 'center', margin: '0.5rem 0 0 0' }}>{usernameErrorMsg}</p>
                                )}
                            </form>
                        </div>
                    </div>
                )
            }

            {
                state === "lobby" && (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: "url('/main_menu_background.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: '1rem',
                    }}>
                        <div style={{
                            width: 900,
                            maxWidth: '96%',
                            padding: '2.5rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.9)',
                            boxShadow: '0 10px 30px rgba(2,6,23,0.35)',
                            backdropFilter: 'blur(6px)',
                            color: '#0b1220',
                        }}>
                            <h1 style={{ margin: 0, paddingBottom: "10px", fontSize: '1.5rem', letterSpacing: '0.6px' }}>Welcome to lobby: {lobbyId}</h1>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: '1rem',
                            }}>
                                <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', gridColumn: gameMode === "knockout" ? 'auto' : '1 / -1' }}>
                                    
                                    {
                                        gameMode === "knockout" ? (
                                            <h2 style={{ margin: 0, marginBottom: '0.75rem', color: '#0f172a', fontSize: '1.1rem' }}>No Team</h2>
                                        ) : (
                                            <h2 style={{ margin: 0, marginBottom: '0.75rem', color: '#0f172a', fontSize: '1.1rem' }}>Players</h2>
                                        )

                                    }
                                    
                                    
                                    <div style={gameMode === "knockout" ? knockoutStylePlayerList : noTeamsStylePlayerList}>
                                        {playerList?.map((username) => {
                                            if (!team1.includes(username) && !team2.includes(username)) {
                                                let usernameDisplay = currentUsername === username ? username + " (You)" : username;
                                                                               
                                                return (
                                                    <div key={username} style={{ padding: '0.55rem 0.75rem', borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0', width: 'fit-content', maxWidth: '100%' }}>
                                                        {usernameDisplay}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                {
                                    gameMode === "knockout" && (
                                        <>
                                            <div style={{ background: 'rgba(239,246,255,0.95)', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem' }}>
                                                <h2 style={{ margin: 0, marginBottom: '0.75rem', color: '#2563eb', fontSize: '1.1rem' }}>Team 1</h2>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {team1?.map((username) => {
                                                        let usernameDisplay = currentUsername === username ? username + " (You)" : username;
                                                        return(
                                                            <div key={username} style={{ padding: '0.55rem 0.7rem', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                                                {usernameDisplay}
                                                            </div>
                                                        )                                          
                                                    })}
                                                </div>
                                            </div>                               

                                            <div style={{ background: 'rgba(254,242,242,0.95)', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem' }}>
                                                <h2 style={{ margin: 0, marginBottom: '0.75rem', color: '#dc2626', fontSize: '1.1rem' }}>Team 2</h2>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {team2?.map((username) => {
                                                        let usernameDisplay = currentUsername === username ? username + " (You)" : username;
                                                        return(
                                                            <div key={username} style={{ padding: '0.55rem 0.7rem', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                                                                {usernameDisplay}
                                                            </div>
                                                        )                                          
                                                    })}
                                                </div>
                                            </div>
                                        
                                        </>
                                    )
                                }
                                
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {gameMode === "knockout" && (
                                        <>
                                            <button type="button" onClick={handleJoinTeam1} style={{ padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>
                                                Join Team 1
                                            </button>
                                            <button type="button" onClick={handleJoinTeam2} style={{ padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>
                                                Join Team 2
                                            </button>
                                        </>
                                    )}
                                </div>

                                {isHost && (gameMode !== "knockout" || (team1.length > 0 && team2.length > 0)) && (
                                    <button onClick={handleStartGame} style={{ marginLeft: 'auto', padding: '0.75rem 1.25rem', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                        Start Game
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showRoundScores && currRoundScores !== null && gameMode !== "knockout" && (state === "inGame" || state === "gameOver") && (
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
                            {Array.isArray(currRoundScores) && currRoundScores.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {currRoundScores.map(([username, score], idx) => (
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
                // Keep the game alive even when game's over so players can see the results on the map of the final round
                (state === "inGame" || state === "gameOver") && ws && (
                    <div>
                        <Game 
                            ws={ws} isHost={isHost} setShowRoundScores={setShowRoundScores} gameMode={gameMode} 
                            showRoundScores={showRoundScores} setState={setState} 
                            region={region} setShowScoreCalculations={setShowScoreCalculations}>

                        </Game>
                    </div>
                )                
            }

            

            {
                state === "inGame" && ws && (
                    <div>
                        {/* All other modes besides knockout */}
                        {totalScores && (totalScores.length > 0) && gameMode !== "knockout" && (
                            <div className="scoreboard">
                                <h3 className="scoreboard-title">Scoreboard</h3>
                                <div className="scoreboard-header">
                                    <span className="scoreboard-col-left">Username</span>
                                    <span className="scoreboard-col-right">Score</span>
                                </div>
                                <ul className="scoreboard-list">
                                {totalScores.map(([username, score], idx) => (
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
                 state === "inGame" && gameMode === "knockout" && multiplierMode === "everyRoundIncrement" && (
                    <div>
                        <MultiplierContainer Multiplier={team1DamageMultiplier} top="15%" left="50%"></MultiplierContainer>
                    </div>
                 )
            }

            {
                state === "inGame" && gameMode === "knockout" && curTeam1HP !== null && maxTeam1HP !== null && curTeam2HP !== null && maxTeam2HP !== null && (
                    <div>
                        <div>
                            <HPBar
                                label="Team 1"
                                hp={curTeam1HP}
                                maxHp={maxTeam1HP}
                                position="left"
                                colour="#0066ff"
                            />
                            {
                            //Note Next to Team1 hp it should show Team2's Dmg mult because the team 2 dmg mult represents how much more damage team 2 it taking because of team1's wins
                            //Just to mimic the real geoguesser game this mult gets placed next to team
                            multiplierMode === "winnerGetsMultiplier" && (
                                <MultiplierContainer Multiplier={team2DamageMultiplier} top="7%" left="84%"></MultiplierContainer>
                            )
                        }
                        </div>
                        
                        <div>
                            <HPBar
                                label="Team 2"
                                hp={curTeam2HP}
                                maxHp={maxTeam2HP}
                                position="right"
                                colour="red"
                            />

                            {
                                multiplierMode === "winnerGetsMultiplier" && (
                                    <MultiplierContainer Multiplier={team1DamageMultiplier} top="7%" left="16%"></MultiplierContainer>
                                )
                            }
                        </div>
                        

                        
                    </div>  
                )                
            }

            {
                state === "inGame" && gameMode === "knockout" && showScoreCalculations && (
                    <div style={{
                        position: 'fixed',
                        top: 0, right: 0, bottom: 0, left: 0,
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        padding: '1rem',
                        backdropFilter: 'blur(4px)',
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            width: '100%',
                            maxWidth: '42rem',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Header */}
                            <div style={{
                                backgroundColor: '#0f172a',
                                color: 'white',
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Round Results & Damage</h2>
                                <button 
                                    onClick={() => setShowScoreCalculations(false)}
                                    style={{
                                        color: '#94a3b8',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        display: 'flex',
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2rem',
                                backgroundColor: '#f8fafc',
                                color: '#0f172a',
                            }}>
                                
                                {/* Scoring Players */}
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem', marginTop: 0 }}>Scoring Players</h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1.5rem',
                                    }}>
                                       
                                    </div>
                                </div>

                                {/* Damage Calculations */}
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem', marginTop: 0 }}>Damage Calculation</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: '#3b82f6' }}></div>
                                                <span style={{ fontWeight: 500, color: '#334155' }}>Team 1 Damage Output</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                <span>{team1MaxDamage}</span>
                                                <span style={{ color: '#94a3b8' }}>×</span>
                                                <span style={{ backgroundColor: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', color: '#334155', fontWeight: 'bold' }}>{prevTeam1DamageMultiplier !== null ? prevTeam1DamageMultiplier : '1'}</span>
                                                <span style={{ color: '#94a3b8' }}>=</span>
                                                <div style={{ transition: 'opacity 300ms ease, transform 300ms ease', opacity: showTeam1CalcAnim ? 1 : 0, transform: showTeam1CalcAnim ? 'translateY(0)' : 'translateY(6px)' }} aria-hidden={!showTeam1CalcAnim}>
                                                    <span style={{ color: 'rgba(36, 151, 71, 1)', fontWeight: 'bold' }}>{Math.round((team1MaxDamage ?? 0) * parseFloat(prevTeam1DamageMultiplier))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: '#ef4444' }}></div>
                                                <span style={{ fontWeight: 500, color: '#334155' }}>Team 2 Damage Output</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                <span>{team2MaxDamage}</span>
                                                <span style={{ color: '#94a3b8' }}>×</span>
                                                <span style={{ backgroundColor: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', color: '#334155', fontWeight: 'bold' }}>{prevTeam2DamageMultiplier !== null ? prevTeam2DamageMultiplier : '1'}</span>
                                                <span style={{ color: '#94a3b8' }}>=</span>
                                                <div style={{ transition: 'opacity 300ms ease, transform 300ms ease', opacity: showTeam2CalcAnim ? 1 : 0, transform: showTeam2CalcAnim ? 'translateY(0)' : 'translateY(6px)' }} aria-hidden={!showTeam2CalcAnim}>
                                                    <span style={{ color: 'rgba(36, 151, 71, 1)', fontWeight: 'bold' }}>{Math.round((team2MaxDamage ?? 0) * parseFloat(prevTeam2DamageMultiplier))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: '#44ef4dff' }}></div>
                                                <span style={{ fontWeight: 500, color: '#334155' }}>Results</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                               
                                                {(() => {
                                                    const team1Dmg = Math.round((team1MaxDamage ?? 0) * parseFloat(prevTeam1DamageMultiplier));
                                                    const team2Dmg = Math.round((team2MaxDamage ?? 0) * parseFloat(prevTeam2DamageMultiplier));
                                                    const netDmg = calculateNetDamage(team1Dmg, team2Dmg);
                                                    const damageTaker = team1Dmg == team2Dmg ? "No Damage Dealth" : team1Dmg > team2Dmg  ? "Team 2 receives:": "Team 1 receives:";
                                                    return (
                                                        <div style={{ transition: 'opacity 300ms ease, transform 300ms ease', opacity: showResultAnim ? 1 : 0, transform: showResultAnim ? 'translateY(0)' : 'translateY(6px)' }} aria-hidden={!showResultAnim}>
                                                            <span style={{ backgroundColor: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', color: '#334155', fontWeight: 'bold' }}>{damageTaker}</span>
                                                            <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '0.5rem' }}>-{netDmg}</span>
                                                        </div>
                                                    );
                                                })()}

                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowScoreCalculations(false)}
                                        style={{
                                            backgroundColor: '#4f46e5',
                                            color: 'white',
                                            padding: '0.625rem 2rem',
                                            borderRadius: '9999px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )
            }

            {
                state === "gameOver" && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        padding: '2rem',
                        zIndex: 10000,
                        width: `max(560px, min(${560 + ((allRoundScores as any)?.length ?? 0) * 60}px, 95vw))`,
                        maxHeight: '90vh',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'black',
                        gap: '1.25rem',
                    }}>
                        {
                            gameMode === "knockout" ? (
                                <div style={{ width: '100%', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Match Concluded</div>
                                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                                            <span style={{ color: winner === "team1" ? '#2563eb' : '#dc2626' }}>
                                                {winner === "team1" ? 'Team 1 Wins' : 'Team 2 Wins'}
                                            </span>
                                        </h1>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ flex: 1, textAlign: 'center', animation: 'fadeUp 0.6s ease-out forwards' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: winner === "team1" ? '#2563eb' : '#dc2626' }}>
                                                {winner === "team1" ? 'Team 1' : 'Team 2'}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                {winner === "team1" ? team1.length : team2.length} Players • Victorious
                                            </div>
                                        </div>

                                        <div style={{ color: '#cbd5e1', fontSize: '1.5rem', fontWeight: 300, fontStyle: 'italic' }}>vs</div>

                                        <div style={{ flex: 1, textAlign: 'center', opacity: 0.6, animation: 'fadeUp 0.6s ease-out 0.2s forwards' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: winner === "team1" ? '#dc2626' : '#2563eb' }}>
                                                {winner === "team1" ? 'Team 2' : 'Team 1'}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                {winner === "team1" ? team2.length : team1.length} Players • Fraudulent
                                            </div>
                                        </div>
                                    </div>

                                    <style>{`
                                        @keyframes fadeUp {
                                            from { opacity: 0; transform: translateY(10px); }
                                            to { opacity: 1; transform: translateY(0); }
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                <div style={{ width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Match Concluded</div>
                                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#0f172a' }}>Final Rankings</h2>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', minHeight: '220px' }}>
                                        <div style={{ flex: 1, maxWidth: '160px', textAlign: 'center', animation: 'fadeUp 0.6s ease-out 0.2s forwards', opacity: 0 }}>
                                            <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a', wordBreak: 'break-word', fontSize: '1.1rem' }}>
                                                {totalScores && (totalScores as any).length > 1 ? (totalScores as any)[1][0] : '-'}
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', borderRadius: '1rem', padding: '1.25rem', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748b', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>2ND</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569' }}>
                                                    {totalScores && (totalScores as any).length > 1 ? (totalScores as any)[1][1] : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, maxWidth: '180px', textAlign: 'center', animation: 'fadeUp 0.6s ease-out forwards', opacity: 0 }}>
                                            <div style={{ fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a', wordBreak: 'break-word', fontSize: '1.25rem' }}>
                                                {totalScores && (totalScores as any).length > 0 ? (totalScores as any)[0][0] : '-'}
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '1rem', padding: '1.5rem', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid #f59e0b', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)' }}>
                                                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>1ST</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fffbeb' }}>
                                                    {totalScores && (totalScores as any).length > 0 ? (totalScores as any)[0][1] : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, maxWidth: '160px', textAlign: 'center', animation: 'fadeUp 0.6s ease-out 0.4s forwards', opacity: 0 }}>
                                            <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a', wordBreak: 'break-word', fontSize: '1.1rem' }}>
                                                {totalScores && (totalScores as any).length > 2 ? (totalScores as any)[2][0] : '-'}
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #fed7aa, #fdba74)', borderRadius: '1rem', padding: '1.25rem', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid #fdba74', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9a3412', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>3RD</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#78350f' }}>
                                                    {totalScores && (totalScores as any).length > 2 ? (totalScores as any)[2][1] : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        <style>{`
                            @keyframes fadeUp {
                                from { opacity: 0; transform: translateY(10px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                    </div>
                )
                
            }


            {
                state === "results" && (
                   <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        padding: '2rem',
                        zIndex: 10000,
                        width: `max(560px, min(${560 + ((allRoundScores as any)?.length ?? 0) * 60}px, 95vw))`,
                        maxHeight: '90vh',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'black',
                        gap: '1.25rem',
                    }}>
                        

                        {allRoundScores && (
                            <div style={{ width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Match Details</div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#0f172a' }}>Round-by-Round Breakdown</h2>
                                </div>

                                <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '120px' }}>Player</th>
                                                {Array.from({ length: (allRoundScores as any).length - 1 }).map((_, roundIdx) => (
                                                    <th key={roundIdx} style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '80px', borderLeft: '1px solid #e2e8f0' }}>
                                                        R{roundIdx + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {totalScores && totalScores.length > 0 && totalScores.map((score, playerIdx) => {
                                                const playerName = score[0];
                                                return (
                                                    <tr key={playerIdx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: playerIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a', minWidth: '120px' }}>{playerName}</td>
                                                        {Array.from({ length: (allRoundScores as any).length - 1 }).map((_, roundIdx) => {
                                                            const roundData = (allRoundScores as any)[roundIdx];
                                                            let playerRoundScore = 0;
                                                            let maxScoreInRound = -Infinity;
                                                            let isHighestScorer = false;

                                                            if (Array.isArray(roundData)) {
                                                                roundData.forEach((entry: any) => {
                                                                    if (entry && Array.isArray(entry) && entry[0] === playerName) {
                                                                        playerRoundScore = entry[1] ?? 0;
                                                                    }
                                                                    if (entry && Array.isArray(entry) && entry[1] !== undefined && entry[1] > maxScoreInRound) {
                                                                        maxScoreInRound = entry[1];
                                                                    }
                                                                });
                                                                isHighestScorer = playerRoundScore === maxScoreInRound && playerRoundScore > 0;
                                                            }

                                                            return (
                                                                <td key={roundIdx} style={{
                                                                    padding: '1rem',
                                                                    textAlign: 'center',
                                                                    fontWeight: 600,
                                                                    backgroundColor: isHighestScorer ? '#f0fdf4' : 'inherit',
                                                                    color: playerRoundScore > 0 ? '#16a34a' : '#ef4444',
                                                                    borderLeft: '1px solid #e2e8f0',
                                                                    minWidth: '80px'
                                                                }}>
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', width: '100%' }}>
                                                                        {playerRoundScore > 0 ? `+${playerRoundScore}` : playerRoundScore}
                                                                        {isHighestScorer && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} title="Highest Score in Round"></span>}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setState('lobby');
                                setAllRoundScores(null);
                                setResultsRequested(false);
                            }}
                            style={{
                                width: '100%',
                                marginTop: '0.25rem',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: '#4f46e5',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Close
                        </button>
                   </div>
                )
            }
            
        </>
    );
}