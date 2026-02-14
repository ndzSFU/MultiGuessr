"use client";
import { useEffect, useRef } from "react";

const Earth_Radius = 6371; 


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
    actualLatLng: {lat: number, long: number} | null
}

export default function ScoreBox({chosenLatLng, actualLatLng}: ScoreBoxProps){

    let latDiff: number = Math.abs(chosenLatLng!.lat - actualLatLng!.lat);

    let longDiff: number = Math.abs(chosenLatLng!.long - actualLatLng!.long);

    let score = 1000;

    if(longDiff > 180){
        longDiff = 360 - longDiff;
    }

    const kmDiff = getDistanceKm(chosenLatLng!.lat, chosenLatLng!.long, actualLatLng!.lat, actualLatLng!.long);

    if(kmDiff > 10){
        let accuracy = kmDiff/13000;
        console.log("Km diff: " + kmDiff);
        console.log("Acc: " + accuracy)
        score = Math.round(score - (score * accuracy));
        if(score < 0) score = 0;
    }

    
    console.log("Score: " + score)
   


    return(
        <div className="score-box">
            Your Score: {score}
        </div>
    );
}