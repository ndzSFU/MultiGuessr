
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stat } from 'fs';
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
        { value: "everyRoundIncrement", label: "Every Round Increment" },
        { value: "winnerGetsMultiplier", label: "Winner Gets Multiplier" },
    ];

    const multiplierIncrementOptions = [
        { value: "0", label: "No Damage Multiplier" },
        { value: "0.1", label: "0.1" },
        { value: "0.25", label: "0.25" },
        { value: "0.5", label: "0.5" },
        { value: "0.75", label: "0.75" },
        { value: "1", label: "1" },
    ];

    const regions = [
        { value: "world", label: "Worldwide" },
        { value: "canada", label: "Canada" },
    ];

export default function Multiplayer() {

    const [mode, setMode] = useState<'menu' | 'create' | 'settings' | 'join'>('menu');
    const [lobbyId, setLobbyId] = useState<string | null>(null);
    const [maxPlayers, setMaxPlayers] = useState<{ value: string, label: string } | null>(null);
    const [maxRounds, setMaxRounds] = useState<{ value: string, label: string } | null>(null);
    const [gameMode, setGameMode] = useState<{ value: string, label: string } | null>(gameModes[0]);
    const [timeLimit, setTimeLimit] = useState<{ value: string, label: string } | null>(null);
    const [HP, setHP] = useState<{ value: string, label: string } | null>(null);
    const [multiplierMode, setMultiplierMode] = useState<{ value: string, label: string } | null>(null);
    const [multiplierIncrement, setMultiplierIncrement] = useState<{ value: string, label: string } | null>(null);
    const [region, setRegion] = useState<{ value: string, label: string } | null>(null);
    

    const router = useRouter();

    type OptionType = { value: string; label: string };
    
    const customSelectStyles: StylesConfig<OptionType, false> = {
        container: (base) => ({
            ...base,
            width: 300,
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

    // Ts deprecatd for now
    function handleJoinLobby(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const lobbyId = formData.get('lobbyId') as string;
        setLobbyId(lobbyId);
        console.log("Lobby Code: " + lobbyId);
        setMode('create');
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
        <div>
            {
                mode === 'menu' && (
                    <>
                        <button onClick={handleLobbySettingsCreation}>Create Lobby</button>
                        <button onClick={() => { setMode('join') }}>Join Lobby</button>
                    </>
                )
            }
            {mode === 'settings' && (
                <>
                    {(lobbyId !== null) && (
                        <>
                            <label>Game Mode:</label>
                            <Select
                                options={gameModes}
                                value={gameMode}
                                onChange={setGameMode}
                                styles={customSelectStyles}
                                placeholder="Select Game Mode"
                            />

                            {/* <label>
                                Max Players:
                            </label>
                            <Select
                                options={maxPlayersOptions}
                                value={maxPlayers}
                                onChange={setMaxPlayers}
                                styles={customSelectStyles}
                            /> */}

                            
                        </>
                    )}

                     <div>
                        <label>Region</label>
                        <Select
                            options={regions}
                            value={region}
                            onChange={setRegion}
                            styles={customSelectStyles}
                            placeholder="Select Region"
                        />
                    </div>

                    {
                        (gameMode?.value === "knockout") && (
                            <div>
                                <label>HP:</label>
                                <Select
                                    options={hpOptions}
                                    value={HP}
                                    onChange={setHP}
                                    styles={customSelectStyles}
                                    placeholder="Select HP"
                                />


                                <label>Damage Multiplier Mode</label>
                                <Select
                                    options={multiplierModes}
                                    value={multiplierMode}
                                    onChange={setMultiplierMode}
                                    styles={customSelectStyles}
                                    placeholder="Select Multiplier Mode"
                                />

                                <label>Damage Multiplier Increment</label>
                                <Select
                                    options={multiplierIncrementOptions}
                                    value={multiplierIncrement}
                                    onChange={setMultiplierIncrement}
                                    styles={customSelectStyles}
                                    placeholder="Select Increment"
                                />
                            </div>

                            
                        )
                    }

                    {
                        (gameMode?.value === "setRounds") ? (
                            <>
                                <label>Max rounds:</label>
                                <Select
                                    options={maxRoundsOptions}
                                    value={maxRounds}
                                    onChange={setMaxRounds}
                                    styles={customSelectStyles}
                                />

                                <label>
                                    Round Time Limit:
                                </label>
                                
                            </>
                        ) : (
                            <>
                                <label>
                                    Countdown After First Guess:
                                </label>
                            </>
                        )
                    }
                            <Select
                                options={timeOptions}
                                value={timeLimit}
                                onChange={setTimeLimit}
                                styles={customSelectStyles}
                            />

                    {
                                (timeLimit && (maxRounds || gameMode?.value === "knockout" || gameMode?.value === "timerTrigger")) && (HP || gameMode?.value !== "knockout") && region && (gameMode?.value !== "knockout" || (multiplierMode && multiplierIncrement)) && (
                            <button type="button" onClick={sendSettings}>Create Lobby</button>
                        )
                    }

                   
                    
                </>
            )}
            {mode === 'join' && (
                <>
                    <form onSubmit={handleJoinLobby}>
                        <label>
                            Lobby Code: <input name="lobbyId" />
                        </label>
                        <button type="submit">Join Lobby</button>
                    </form>
                </>
            )}


        </div>
    );
}