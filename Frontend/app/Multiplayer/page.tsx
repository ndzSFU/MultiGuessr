'use client';
import { useEffect, useState } from 'react';


export default function Multiplayer(){
    const [clientId, setClientId] = useState<string | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:9090');

        ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        if (data.method === 'connect') {
            setClientId(data.clientId);
            ws.send(JSON.stringify({ method: 'connect', clientId: data.clientId, testMsg: "test" }));
        }

        };

        return () => {
             ws.close();
        };
  }, []);
    return(
        <div>
            <div>Client ID: {clientId ?? 'Connecting...'}</div>
        </div>
    );
}