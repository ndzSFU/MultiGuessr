
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stat } from 'fs';


export default function Multiplayer(){
    
    const [view, setView] = useState<'menu' | 'create' | 'settings' | 'join'>('menu');
    const [lobbyId, setLobbyId] = useState<string>();
    const [username, setUsername] = useState<string>();
    const [maxPlayers, setMaxPlayers] = useState<string>();
    
    const router = useRouter();


    function handleJoinLobby(event: React.SubmitEvent<HTMLFormElement>){
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const lobbyId = formData.get('lobbyId') as string;
        const username = formData.get('username') as string;
        setLobbyId(lobbyId);
        setUsername(username);
        console.log("Lobby Code: " + lobbyId);
    }

    function handleLobbySettings(event: React.SubmitEvent<HTMLFormElement>){
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const maxPlayers = formData.get('maxPlayers') as string;
        const username = formData.get('username') as string;
        setUsername(username);
        setMaxPlayers(maxPlayers);
    }

    async function sendSettings(){
        const form = document.querySelector('form') as HTMLFormElement;
        const formData = new FormData(form);
        const maxPlayersValue = formData.get('maxPlayers') as string;
        const usernameValue = formData.get('username') as string;
        
        const response = await fetch('http://localhost:9090/api/lobbyInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: lobbyId, username: usernameValue, maxPlayers: maxPlayersValue })
        });
        const status = await response.text();
        console.log(status);
        setView('create');
    }

    async function handleLobbySettingsCreation(){
        const response = await fetch("http://localhost:9090/api/createLobbyId");
        const newLobbyID = await response.text();
        setLobbyId(newLobbyID);
        console.log(newLobbyID);
        setView('settings');
    }

    useEffect(() => {
        if (view === 'create' && lobbyId) {
            router.push(`/Multiplayer/${lobbyId}`);
        }
    }, [view, router]);

    return(
        <div>
            {
             view === 'menu' && (
                <>
                    <button onClick={handleLobbySettingsCreation}>Create Lobby</button>
                    <button onClick={()=>{setView('join')}}>Join Lobby</button>
                </>
             ) 
            }
            {view === 'settings' && (
                <>
                    {lobbyId && (
                        <>
                            <form onSubmit={handleLobbySettings}>
                                <label>
                                    Max Players: <input name="maxPlayers" />
                                </label>
                                <label>
                                    Username: <input name="username" />
                                </label>
                                <button type="button" onClick={sendSettings}>Create Lobby</button>
                            </form>

                        
                        </>
                        ) 
                    }
                </>
            )}
            {view === 'join' && (
                <>
                <form onSubmit={handleJoinLobby}>
                    <label>
                        Lobby Code: <input name="lobbyId" />
                    </label>
                    <label>
                        Username: <input name="username" />
                    </label>
                    <button type="submit">Join Lobby</button>
                </form>
                </>
            )}
            
            
        </div>
    );
}