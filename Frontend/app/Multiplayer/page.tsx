
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Select from 'react-select'
import { StylesConfig } from 'react-select';

const API_BASE = (
    (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')) ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9090')
);

const maxPlayersOptions = [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
        { value: "7", label: "7" },
        { value: "8", label: "8" },
        { value: "9", label: "9" },
        { value: "10", label: "10" },
    ];

    const maxRoundsOptions = [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "5", label: "5" },
        { value: "6", label: "6" },
        { value: "7", label: "7" },
        { value: "8", label: "8" },
        { value: "9", label: "9" },
        { value: "10", label: "10" },
        { value: "15", label: "15" },
        { value: "20", label: "20" },
        { value: "25", label: "25" },
    ];

    const timeOptions = [
        { value: "15", label: "15 Seconds" },
        { value: "20", label: "20 Seconds" },
         { value: "25", label: "25 Seconds" },
        { value: "30", label: "30 Seconds" },
        { value: "45", label: "45 Seconds" },
        { value: "60", label: "1 Minute" },
        { value: "75", label: "1 Minute 15 Seconds" },
        { value: "90", label: "1 Minute 30 Seconds" },
        { value: "105", label: "1 Minute 45 Seconds" },
        { value: "120", label: "2 Minutes" },
        { value: "135", label: "2 Minutes 15 Seconds" },
        { value: "150", label: "2 Minutes 30 Seconds" },
    ];

    const hpOptions = [
        { value: "1000", label: "1,000 HP" },
        { value: "2000", label: "2,000 HP" },
        { value: "3000", label: "3,000 HP" },
        { value: "4000", label: "4,000 HP" },
        { value: "5000", label: "5,000 HP" },
        { value: "6000", label: "6,000 HP" },
        { value: "7000", label: "7,000 HP" },
        { value: "8000", label: "8,000 HP" },
        { value: "9000", label: "9,000 HP" },
        { value: "10000", label: "10,000 HP" },
    ];

    const gameModes = [
        {value: "setRounds", label:"Regular"},
        {value: "knockout", label:"Teams"},
        {value: "timerTrigger", label:"Time Trigger"},
    ];

    const multiplierModes = [
        { value: "everyRoundIncrement", label: "Casual" },
        { value: "winnerGetsMultiplier", label: "Competitive" },
        { value: "loserGetsMultiplier", label: "Handicap" },
    ];

    const multiplierIncrementOptions = [
        { value: "0", label: "No Damage Multiplier" },
        { value: "0.05", label: "0.05" },
        { value: "0.1", label: "0.1" },
        { value: "0.25", label: "0.25" },
        { value: "0.5", label: "0.5" },
        { value: "0.75", label: "0.75" },
        { value: "1", label: "1" },
    ];

    const regions = [
        { value: "world", label: "Worldwide" },
        { value: "canada", label: "Canada" },
        { value: "usa", label: "USA" },
        { value: "na", label: "North America" },
        { value: "europe", label: "Europe" },
        { value: "southAmerica", label: "South America" },
        { value: "centralAmericaCaribbean", label: "Central America & Caribbean" },
        { value: "latinAmerica", label: "Latin America" },
        { value: "asia", label: "Asia" },
        { value: "middleEast", label: "Middle East" },
        { value: "africa", label: "Africa" },
        { value: "oceania", label: "Oceania" },
    ];

export default function Multiplayer() {

    const [state, setState] = useState<'multiplayerMenu' | 'create' | 'settings' | 'join'>('multiplayerMenu');
    const [lobbyId, setLobbyId] = useState<string | null>(null);
    const [maxPlayers, setMaxPlayers] = useState<{ value: string, label: string } | null>(null);
    const [maxRounds, setMaxRounds] = useState<{ value: string, label: string } | null>({value: "10", label: "10" });
    const [gameMode, setGameMode] = useState<{ value: string, label: string } | null>(gameModes[0]);
    const [timeLimit, setTimeLimit] = useState<{ value: string, label: string } | null>({ value: "60", label: "1 Minute" });
    const [HP, setHP] = useState<{ value: string, label: string } | null>({ value: "3000", label: "3,000 HP" });
    const [multiplierMode, setMultiplierMode] = useState<{ value: string, label: string } | null>( { value: "everyRoundIncrement", label: "Casual" });
    const [multiplierIncrement, setMultiplierIncrement] = useState<{ value: string, label: string } | null>({ value: "0.25", label: "0.25" });
    const [region, setRegion] = useState<{ value: string, label: string } | null>({ value: "world", label: "Worldwide" });
    const [badLobbyId, setBadLobbyId] = useState<boolean>(false);

    const router = useRouter();

    type OptionType = { value: string; label: string };
    
    const customSelectStyles: StylesConfig<OptionType, false> = {
        container: (base) => ({
            ...base,
            width: '100%',
        }),
        option: (base, state) => ({
            ...base,
            color: state.isSelected ? 'white' : '#1e293b',
            backgroundColor: state.isSelected ? '#3b82f6' : 'white',
        }),
        singleValue: (base) => ({
            ...base,
            color: '#1e293b',
        }),
        input: (base) => ({
            ...base,
            color: '#1e293b',
        }),
        placeholder: (base) => ({
            ...base,
            color: '#1e293b',
        }),
    };


    async function validLobbyId(lobbyId: string): Promise<boolean> {
         const response = await fetch(API_BASE + "/api/validateLobbyId", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify(
                {
                    lobbyId: lobbyId,
                }
            )
         });
         return response.json();
    }
    
    function handleJoinLobby(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setBadLobbyId(false);

        const formData = new FormData(event.currentTarget);
        const lobbyId = formData.get('lobbyId') as string;

        let lobbyIdValid = validLobbyId(lobbyId);

        lobbyIdValid.then((value) => {
            if(value === true){
                setLobbyId(lobbyId);
                console.log("Lobby Code: " + lobbyId);
                setState('create');
            } else {
                console.log("Error lobbyId not found in server.")
                setBadLobbyId(true);
            }
        }).catch((reason) => {
            console.log("Error server did not respond");
            console.log("Reason: " + reason);
        });
           
    }

    async function sendSettings() {
        const response = await fetch(API_BASE + '/api/createLobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify({
                lobbyId: lobbyId,
                gameMode: gameMode?.value,
                maxPlayers: maxPlayers?.value,
                maxRounds: multiplierMode?.value === "knockout" ? 999 : maxRounds?.value,
                timeLimit: timeLimit?.value,
                HP: HP?.value,
                multiplierMode: multiplierMode?.value,
                multiplierIncrement: multiplierIncrement?.value,
                region: region?.value,
            })
        });
        const status = await response.text();
        console.log(status);
        setState('create');
    }

    async function handleLobbySettingsCreation() {
        try {
            console.log('API_BASE:', API_BASE);
            const response = await fetch(API_BASE + "/api/createLobbyId", {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            const newLobbyID = await response.text();
            setLobbyId(newLobbyID);
            console.log(newLobbyID);
            setState('settings');
        } catch (err) {
            console.error('Failed to create lobby id via', API_BASE + '/api/createLobbyId', err);
            setBadLobbyId(true);
        }
    }

    useEffect(() => {
        if (state === 'create' && lobbyId) {
            router.push(`/Multiplayer/${lobbyId}`);
        }
    }, [state, router]);

    useEffect(() => {
        if(gameMode?.value === "knockout"){
            setTimeLimit({ value: "15", label: "15 Seconds" },)
        } else {
            setTimeLimit({ value: "60", label: "1 Minute" });
        }
    }, [gameMode]);

        return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: "url('/main_menu_background.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >

                    <div
                        style={{
                            position: 'relative',
                            width: 720,
                            maxWidth: '92%',
                            padding: '2.5rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.9)',
                            boxShadow: '0 10px 30px rgba(2,6,23,0.35)',
                            backdropFilter: 'blur(6px)',
                            textAlign: 'left',
                        }}
                    >

                        <button
                            onClick={() => {
                                if(state === "multiplayerMenu"){
                                    router.push(`/`);
                                } else if (state === "settings"){
                                    setState("multiplayerMenu");
                                }
                                
                            }}
                            title={"Return to previous page"}
                            style={{
                                position: 'absolute',
                                top: '1.2rem',
                                right: '1.5rem',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '2rem',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                
                            }}
                            aria-label="Return to Main Menu"
                        >
                            x
                        </button>


                        <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.6px', color: '#0b1220' }}>Multiplayer</h1>
                        <p style={{ marginTop: '0.25rem', marginBottom: '1rem', color: '#111827' }}>See who knows cities the best!</p>

                        {state === 'multiplayerMenu' && (
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button
                                    onClick={handleLobbySettingsCreation}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem 1rem',
                                        borderRadius: 8,
                                        border: '2px solid rgba(11,17,34,0.08)',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        background: 'transparent',
                                        color: '#0b1220',
                                    }}
                                >
                                    Create Lobby
                                </button>
                                <button
                                    onClick={() => { setState('join') }}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem 1rem',
                                        borderRadius: 8,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        background: 'linear-gradient(90deg,#06b6d4,#3b82f6)',
                                        color: 'white',
                                    }}
                                >
                                    Join Lobby
                                </button>
                            </div>
                        )}

                        {state === 'settings' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                                {(lobbyId !== null) && (
                                    <div>
                                        <label style={{ fontWeight: 600, color: '#0b1220' }}>Game Mode</label>
                                        <Select
                                            options={gameModes}
                                            value={gameMode}
                                            onChange={setGameMode}
                                            styles={customSelectStyles}
                                            placeholder="Select Game Mode"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label style={{ fontWeight: 600, color: '#0b1220' }}>Select a Region</label>
                                    <Select
                                        options={regions}
                                        value={region}
                                        onChange={setRegion}
                                        styles={customSelectStyles}
                                        placeholder="Worldwide"
                                    />
                                </div>

                                 { (gameMode?.value === "setRounds") ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>

                                            <label style={{ fontWeight: 600, color: '#0b1220' }}>Max rounds</label>
                                            <Select
                                                options={maxRoundsOptions}
                                                value={maxRounds}
                                                onChange={setMaxRounds}
                                                styles={customSelectStyles}
                                                placeholder="10"
                                            />

                                         </div>

                                         <div>
                                        <label style={{ fontWeight: 600, color: '#0b1220' }}>Round Time Limit</label>
                                            <Select
                                                    options={timeOptions}
                                                    value={timeLimit}
                                                    onChange={setTimeLimit}
                                                    styles={customSelectStyles}
                                                />
                                         </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ fontWeight: 600, color: '#0b1220' }}>Countdown After First Guess</label>
                                        
                                            <Select
                                                options={timeOptions}
                                                value={timeLimit}
                                                onChange={setTimeLimit}
                                                styles={customSelectStyles}
                                            />
                                       
                                    </div>
                                )}

                               

                                {(gameMode?.value === "knockout") && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontWeight: 600, color: '#0b1220' }}>Select HitPoints</label>
                                            <Select
                                                options={hpOptions}
                                                value={HP}
                                                onChange={setHP}
                                                styles={customSelectStyles}
                                                placeholder="Select HP"
                                            />
                                        </div>
                                
                                        <div>
                                            <label style={{ fontWeight: 600, color: '#0b1220' }}>Damage Multiplier Increment</label>
                                            <Select
                                                options={multiplierIncrementOptions}
                                                value={multiplierIncrement}
                                                onChange={setMultiplierIncrement}
                                                styles={customSelectStyles}
                                                placeholder="Select Increment"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontWeight: 600, color: '#0b1220' }}>Damage Multiplier Mode</label>
                                            <Select
                                                options={multiplierModes}
                                                value={multiplierMode}
                                                onChange={setMultiplierMode}
                                                styles={customSelectStyles}
                                                placeholder="Select Multiplier Mode"
                                            />
                                        </div>
                                    </div>
                                )}

                               

                                {(timeLimit && (maxRounds || gameMode?.value === "knockout" || gameMode?.value === "timerTrigger")) && (HP || gameMode?.value !== "knockout") && region && (gameMode?.value !== "knockout" || (multiplierMode && multiplierIncrement)) && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        <button type="button" onClick={sendSettings} style={{ padding: '0.6rem 1rem', borderRadius: 8, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: 'white', fontWeight: 700 }}>Create Lobby</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {state === 'join' && (
                            <div>

                                <form onSubmit={handleJoinLobby} style={{ display: 'flex', padding: "0.0rem", alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <label style={{ flex: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0 }}>
                                        <span style={{ fontSize: '0.95rem', color: '#0b1220', marginBottom: '0.25rem' }}>Lobby Code</span>
                                        <input name="lobbyId" style={{ width: '180px', height: '40px', boxSizing: 'border-box', borderRadius: 6, fontSize: '1.05rem', padding: "0.4rem", border: '1px solid #e5e7eb' }} />
                                    </label>
                                    <button type="submit" style={{ height: '40px', padding: '0 0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Join</button>
                                </form> 

                                {badLobbyId && (
                                    <label style={{ fontWeight: 600, color: '#f50707', marginTop: '0.5rem' }}>Invalid lobby id</label>
                                )}

                            </div>
                        )}

                        

                    </div>
                </div>
        );
}