'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Lobby(){
    const [clientId, setClientId] = useState<string | null>(null);
    const [username, setUsername] = useState<string>();
    const [ws, setWs] = useState<WebSocket | null>();
    const [state, setState] = useState<"noName" | "lobby">("noName");

    const params = useParams();
    const lobbyId = params.lobbyId as string;

   

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:9090');
        setWs(ws);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.method === 'connect') {
                setClientId(data.clientId);
                console.log(clientId);
                ws.send(JSON.stringify({ method: 'connect', clientId: data.clientId, testMsg: "test" }));
            }

        };

        return () => {
            ws.close();
        };
  }, []);

   function handleUsername(event: React.SubmitEvent<HTMLFormElement>){
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;

        if(ws && username) ws.send(JSON.stringify({ method: 'setUsername', username: username }));

        setState("lobby");
    }

  return(
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
       
    </>
  );
}