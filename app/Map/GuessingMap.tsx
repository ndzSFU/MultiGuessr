"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "./GuessingMap.css"
import 'leaflet/dist/leaflet.css';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

import {City} from './cities';

interface GuessingMapProps{
    lat: number,
    long: number,
    rerollCity: () => void
}


export default function GuessingMap({lat, long, rerollCity}: GuessingMapProps): React.ReactNode{
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const curMarker = useRef<L.Marker<any> | null>(null);

    // Create the map only once on mount
    useEffect(() => {
        import('leaflet').then(L => {
            L.Icon.Default.mergeOptions({
                iconUrl,
                iconRetinaUrl,
                shadowUrl
            });
            if (divRef.current && !mapRef.current) {
                mapRef.current = L.map(divRef.current).setView([0, 0], 1);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapRef.current);

                function OnMapClick(e: L.LeafletMouseEvent): void {
                    if(curMarker.current) curMarker.current.remove();
                    curMarker.current = L.marker(e.latlng).addTo(mapRef.current!);
                }
                mapRef.current.on('click', OnMapClick);
            }
        });
    }, []);

    function handleGuess(): void{
        console.log("Chosen Coords: " + curMarker.current?.getLatLng());
        console.log("Actual coords: " + lat, long)
    }

    function handleNext(): void{
        if(curMarker.current) curMarker.current.remove();
        if (mapRef.current) mapRef.current.setView([0, 0], 1);
        rerollCity();
    }

    return(
        <div style={{height: '300px', width: '100%'}}>
            <div id="map" ref={divRef} style={{height: '300px', width: '100%'}}></div>
            <button className="GuessBtn" onClick={handleGuess}>Guess</button>
            <button className="NextBtn" onClick={handleNext}>Next Guess</button>
        </div>
        
    );
}