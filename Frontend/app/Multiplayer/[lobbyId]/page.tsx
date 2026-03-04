'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Lobby() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [username, setUsername] = useState<string>();
    const [ws, setWs] = useState<WebSocket | null>();
    const [state, setState] = useState<"noName" | "lobby" | "error" | "inGame">("noName");
    const [isHost, setIsHost] = useState<boolean>(false);

    const params = useParams();
    const lobbyId = params.lobbyId as string;



    useEffect(() => {
        const ws = new WebSocket('ws://localhost:9090');
        setWs(ws);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            ws.onopen = () => {
                console.log("WebSocket connected");
            };

            if (data.method === 'connect') {
                setClientId(data.clientId);
                console.log(clientId);
                ws.send(JSON.stringify({ method: 'connect', lobbyId: lobbyId, clientId: data.clientId}));
            }

            if(data.method === "setHost"){
                setIsHost(true);
            }

            if(data.method === "loadGame"){
                setState("inGame");
            }

        };

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

    function handleStartGame(){
        console.log("Starting Game!");
        if(ws) ws.send(JSON.stringify({ method: 'startGame'}));
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
                state === "inGame" && (
                    <div>
                        IN THE GAME
                    </div>
                )
            }

        </>
    );
}