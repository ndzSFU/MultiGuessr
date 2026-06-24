import { Property } from "csstype";
import {useEffect, useState} from 'react';

interface HPBarProps {
    label: string;
    hp: number | null;
    maxHp: number;
    position: 'left' | 'right';
    colour: Property.Color;
    team: string[];
    ws: WebSocket | null;
}

export default function HPBar({ label, hp, maxHp, position, colour, team, ws}: HPBarProps) {
    const currentHp = hp ?? maxHp;
    const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    const [alreadyGuessed, setAlreadyGuessed] = useState<string[]>([]);
    
    // Determine color based on HP percentage
    let barColor = '#22c55e'; // green
    if (hpPercentage < 50) barColor = '#eab308'; // yellow
    if (hpPercentage < 25) barColor = '#ef4444'; // red

     useEffect(() => {
            if(!ws) return;
    
            function handleMessage(event: MessageEvent){
                const data = JSON.parse(event.data);
                console.log('Received:', data);
    
                if(data.method === "guessMade" || data.method === "finalGuessMade"){
                    console.log("HP BAR GOT THE MESSAGE");
                    setAlreadyGuessed(prevGuessed => [...prevGuessed, data.username]);
                }

                if(data.method === "setCity"){
                    setAlreadyGuessed([]);
                }
            }
    
            ws?.addEventListener("message", handleMessage);
    
            return () => {
                ws.removeEventListener('message', handleMessage);
            };
        }, [ws]);

    return (
        <div
            style={{
                position: 'fixed',
                top: '1rem',
                [position === 'left' ? 'left' : 'right']: '1rem',
                background: '#1f2937',
                border: '2px solid #374151',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                minWidth: '200px',
                zIndex: 1000,
            }}
        >
            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: colour, textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>
                HP: <span style={{ color: barColor }}>{currentHp}</span> / {maxHp}
            </div>
            <div
                style={{
                    width: '100%',
                    height: '24px',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '0.25rem',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${hpPercentage}%`,
                        background: barColor,
                        transition: 'width 0.3s ease, background-color 0.3s ease',
                    }}
                />
            </div>
            {team && team.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    {team.map((username) => {
                        console.log("Team Array:", team);
                        console.log("Guessed Array:", alreadyGuessed);

                        return(
                            <div key={username} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <div style={{ color: colour, padding: '0.35rem 0.6rem', borderRadius: 5, fontSize: '0.85rem' }}>
                                    
                                    {
                                        alreadyGuessed.includes(username) ? (
                                            <span>{username} 🟢</span>
                                        ) : (
                                            <span>{username} ⚪</span>
                                        )
                                    }
                                </div>
                            </div>
                        )
                        
                    })}
                </div>
            )}
        </div>
    );
}
