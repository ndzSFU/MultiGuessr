"use client";
import { useEffect, useRef, useState } from "react";
import 'leaflet/dist/leaflet.css';
import type L from "leaflet";

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

import {City} from './cities';
import ScoreBox from "./ScoreBox";

interface GuessingMapProps{
    lat: number,
    long: number,
    rerollCity: () => void
}


export default function GuessingMap({lat, long, rerollCity}: GuessingMapProps): React.ReactNode{
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const curMarker = useRef<L.Marker<any> | null>(null);
    const [hasGuessed, setHasGuessed] = useState<boolean>(false);
    const leafletRef = useRef<typeof L | null>(null);
    const actualMarker = useRef<L.Marker<any> | null>(null);

    // Create the map only once on mount
    useEffect(() => {
        import('leaflet').then(L => {
            L.Icon.Default.mergeOptions({
                iconUrl,
                iconRetinaUrl,
                shadowUrl
            });
            if (divRef.current && !mapRef.current) {
                const maxBounds = L.latLngBounds(
                    L.latLng(-90, -180),
                    L.latLng(90, 180)
                );
                
                mapRef.current = L.map(divRef.current, {
                    maxBounds: maxBounds,
                    maxBoundsViscosity: 1.0,
                    worldCopyJump: false,
                    minZoom: 1,
                }).setView([0, 0], 1);

                leafletRef.current = L;
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    noWrap: true
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
        setHasGuessed(true);
        
        if (leafletRef.current && mapRef.current) {
            const redIcon = leafletRef.current.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });
            actualMarker.current = leafletRef.current.marker([lat, long], {icon: redIcon}).addTo(mapRef.current);
        }
    }

    function handleNext(): void{
        if(curMarker.current){
            curMarker.current.remove();
            curMarker.current = null;
        }

        if (mapRef.current) mapRef.current.setView([0, 0], 1);
        rerollCity();
    }

    return(
        <div style={{height: '300px', width: '100%'}}>
            <div id="map" ref={divRef} style={{height: '300px', width: '100%'}}></div>
            <button className="GuessBtn" onClick={handleGuess}>Guess</button>
            { 
                hasGuessed && (
                    <div>
                         <button className="NextBtn" onClick={handleNext}>Next</button> 
                        <ScoreBox chosenLatLng={{lat: curMarker.current?.getLatLng().lat || 0, long: curMarker.current?.getLatLng().lng || 0}} actualLatLng={{lat: lat, long: long}}></ScoreBox>
                    </div>
                )
            } 
            
        </div>
        
    );
}