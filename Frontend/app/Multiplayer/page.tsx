
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stat } from 'fs';
import Select from 'react-select'
import { StylesConfig } from 'react-select';

export default function Multiplayer() {

    const [mode, setMode] = useState<'menu' | 'create' | 'settings' | 'join'>('menu');
    const [lobbyId, setLobbyId] = useState<string | null>(null);
    const [maxPlayers, setMaxPlayers] = useState<{ value: string, label: string } | null>(null);
    const [maxRounds, setMaxRounds] = useState<{ value: string, label: string } | null>(null);

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
        // const formData = new FormData(event.currentTarget);
        // const lobbyId = formData.get('lobbyId') as string;
        // setLobbyId(lobbyId);
        // console.log("Lobby Code: " + lobbyId);
        // setMode('create');
    }

    async function sendSettings() {
        const response = await fetch('http://localhost:9090/api/createLobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: lobbyId, maxPlayers: maxPlayers?.value, maxRounds: maxRounds?.value })
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
                            <label>
                                Max Players:
                            </label>

                            <Select
                                options={maxPlayersOptions}
                                value={maxPlayers}
                                onChange={setMaxPlayers}
                                styles={customSelectStyles}
                                
                            />

                            <label>Max rounds:</label>
                            <Select
                                options={maxRoundsOptions}
                                value={maxRounds}
                                onChange={setMaxRounds}
                                styles={customSelectStyles}
                            />



                            <button type="button" onClick={sendSettings}>Create Lobby</button>
                        </>
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