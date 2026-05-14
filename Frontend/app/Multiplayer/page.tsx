
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Select from 'react-select'
import { StylesConfig } from 'react-select';

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
        { value: "10", label: "15" },
        { value: "10", label: "20" },
        { value: "10", label: "25" },
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
        {value: "setRounds", label:"Set Time"},
        {value: "knockout", label:"Knockout Teams"},
        {value: "timerTrigger", label:"Triggered Timer"},
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
    ];

export default function Multiplayer() {

    const [mode, setMode] = useState<'menu' | 'create' | 'settings' | 'join'>('menu');
    const [lobbyId, setLobbyId] = useState<string | null>(null);
    const [maxPlayers, setMaxPlayers] = useState<{ value: string, label: string } | null>(null);
    const [maxRounds, setMaxRounds] = useState<{ value: string, label: string } | null>(null);
    const [gameMode, setGameMode] = useState<{ value: string, label: string } | null>(gameModes[0]);
    const [timeLimit, setTimeLimit] = useState<{ value: string, label: string } | null>(null);
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
         const response = await fetch("http://localhost:9090/api/validateLobbyId", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
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
                setMode('create');
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
        const response = await fetch('http://localhost:9090/api/createLobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lobbyId: lobbyId,
                gameMode: gameMode?.value,
                maxPlayers: maxPlayers?.value,
                maxRounds: maxRounds?.value,
                timeLimit: timeLimit?.value,
                HP: HP?.value,
                multiplierMode: multiplierMode?.value,
                multiplierIncrement: multiplierIncrement?.value,
                region: region?.value,
            })
        });
        const status = await response.text();
        console.log(status);
        setMode('create');
    }

    async function handleLobbySettingsCreation() {
        const response = await fetch("http://localhost:9090/api/createLobbyId");
        const newLobbyID = await response.text();
        setLobbyId(newLobbyID);
        console.log(newLobbyID);
        setMode('settings');
    }

    useEffect(() => {
        if (mode === 'create' && lobbyId) {
            router.push(`/Multiplayer/${lobbyId}`);
        }
    }, [mode, router]);

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
                        <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.6px', color: '#0b1220' }}>Multiplayer</h1>
                        <p style={{ marginTop: '0.25rem', marginBottom: '1rem', color: '#111827' }}>See who knows cities the best!</p>

                        {mode === 'menu' && (
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
                                    onClick={() => { setMode('join') }}
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

                        {mode === 'settings' && (
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

                        {mode === 'join' && (
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