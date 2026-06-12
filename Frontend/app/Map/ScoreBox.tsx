"use client";
import { useEffect, useRef, useState } from "react";

const Earth_Radius = 6371; 
const Max_Guess_Dist = 4600;
const Dampner = 1.055;


function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Earth_Radius * c;
}

interface ScoreBoxProps{
    chosenLatLng: {lat: number, long: number} | null,
    actualLatLng: {lat: number, long: number} | null,
    ws?: WebSocket,
    gameMode?: string,
}

export default function ScoreBox({chosenLatLng, actualLatLng, ws}: ScoreBoxProps){

    const hasSentScore = useRef(false);

    const [showScore, setShowScore] = useState<boolean>(false);

    let latDiff: number = Math.abs(chosenLatLng!.lat - actualLatLng!.lat);

    let longDiff: number = Math.abs(chosenLatLng!.long - actualLatLng!.long);

    let score = 1000;

    if(longDiff > 180){
        longDiff = 360 - longDiff;
    }

    const kmDiff = getDistanceKm(chosenLatLng!.lat, chosenLatLng!.long, actualLatLng!.lat, actualLatLng!.long);

    if(kmDiff > 2){
        let accuracy = kmDiff/Max_Guess_Dist;
        console.log("Km diff: " + kmDiff);
        console.log("Acc: " + accuracy)
        score = Math.round(score - (score * accuracy * Dampner));
        if(score < 0) score = 0;
    }

    
    console.log("Score: " + score)

    useEffect(() => {
            if(!ws) return;
    
            function handleMessage(event: MessageEvent){
                const data = JSON.parse(event.data);
               
                if(data.method === "finalGuessMade"){
                    setShowScore(true);
                }

                if(data.method === "setCity"){
                    setShowScore(false);
                }
            }
    
            ws?.addEventListener("message", handleMessage);
    
            return () => {
                ws.removeEventListener('message', handleMessage);
            };
        }, [ws]);

    useEffect(() => {
        if (hasSentScore.current) return;
        hasSentScore.current = true;
        
        ws?.send(JSON.stringify({ method: 'sendScore', score: score, lat: chosenLatLng!.lat, lng: chosenLatLng!.long}));
        console.log(JSON.stringify({ method: 'sendScore', score: score, LatLng: chosenLatLng }));
    }, []);
   
    return(
        <div>
            {
                showScore && (
                    <p style={{color: 'black', padding: '0px', margin: '0px'}}>Your Score: {score}</p>
                )
                
            }
        </div>
        

    );
}