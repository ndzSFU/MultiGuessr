'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function Lobby(){
    const [clientId, setClientId] = useState<string | null>(null);

    const params = useParams();
    const lobbyId = params.lobbyId as string;

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:9090');

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

  return(
    <>
        Welcome To Lobby: {lobbyId}
    </>
  );
}