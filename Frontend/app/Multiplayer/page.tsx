
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stat } from 'fs';


export default function Multiplayer(){
    
    const [mode, setMode] = useState<'menu' | 'create' | 'settings' | 'join'>('menu');
    const [lobbyId, setLobbyId] = useState<string>();
    const [maxPlayers, setMaxPlayers] = useState<string>();
    
    const router = useRouter();


    function handleJoinLobby(event: React.SubmitEvent<HTMLFormElement>){
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const lobbyId = formData.get('lobbyId') as string;
        const username = formData.get('username') as string;
        setLobbyId(lobbyId);
        console.log("Lobby Code: " + lobbyId);
        setMode('create');
    }

    async function sendSettings(event: React.MouseEvent<HTMLButtonElement>){
        const form = (event.target as HTMLButtonElement).closest('form') as HTMLFormElement;
        const formData = new FormData(form);
        const maxPlayers = formData.get('maxPlayers') as string;
        const username = formData.get('username') as string;
        setLobbyId(lobbyId);
        const response = await fetch('http://localhost:9090/api/createLobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: lobbyId, maxPlayers: maxPlayers })
        });
        const status = await response.text();
        console.log(status);
        setMode('create');
    }

    async function handleLobbySettingsCreation(){
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

    return(
        <div>
            {
             mode === 'menu' && (
                <>
                    <button onClick={handleLobbySettingsCreation}>Create Lobby</button>
                    <button onClick={()=>{setMode('join')}}>Join Lobby</button>
                </>
             ) 
            }
            {mode === 'settings' && (
                <>
                    {lobbyId && (
                        <>
                            <form>
                                <label>
                                    Max Players: <input name="maxPlayers" />
                                </label>
                                <button type="button" onClick={sendSettings}>Create Lobby</button>
                            </form>

                        
                        </>
                        ) 
                    }
                </>
            )}
            {mode === 'join' && (
                <>
                <form onSubmit={handleJoinLobby}>
                    <label>
                        Lobby Code: <input name="userName" />
                    </label>
                    <button type="submit">Join Lobby</button>
                </form>
                </>
            )}
            
            
        </div>
    );
}