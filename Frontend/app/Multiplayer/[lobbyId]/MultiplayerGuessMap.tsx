"use client";
import { useEffect, useRef, useState } from "react";
import 'leaflet/dist/leaflet.css';
import type L from "leaflet";

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

import {City} from '../../Map/cities';
import ScoreBox from "../../Map/ScoreBox";

interface MultiplayerGuessMapProps{
    lat: number,
    long: number,
    rerollCity: () => void,
    ws: WebSocket,
    isHost: boolean,
}


export default function MultiplayerGuessMap({lat, long, rerollCity, ws, isHost}: MultiplayerGuessMapProps): React.ReactNode{
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const curMarker = useRef<L.Marker<any> | null>(null);
    const [hasGuessed, setHasGuessed] = useState<boolean>(false);
    const leafletRef = useRef<typeof L | null>(null);
    const actualMarker = useRef<L.Marker<any> | null>(null);
    const [hasClicked, setHasClicked] = useState<boolean>(false);

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
                    setHasClicked(true);
                }
                mapRef.current.on('click', OnMapClick);

                // Handle resize when container expands/shrinks on hover
                const resizeObserver = new ResizeObserver(() => {
                    if (mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                });
                resizeObserver.observe(divRef.current);
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
        if (isHost) rerollCity();
    }

    return(
        <div style={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column'}}>
            <div id="map" ref={divRef} style={{flex: 1, width: '100%', minHeight: 0}}></div>
            <div style={{padding: '4px', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: '4px'}}>
                
                {
                    !hasGuessed && hasClicked && (
                        <button className="GuessBtn" onClick={handleGuess} style={{padding: '2px 4px', marginRight: '2px', cursor: 'pointer'}}>Guess</button>
                    )
                }

                { 
                    (hasGuessed && isHost) && (
                        <>
                            <button className="NextBtn" onClick={handleNext} style={{padding: '2px 4px', cursor: 'pointer'}}>Next Round</button> 
                        </>
                    ) 
                } 
                {
                    hasGuessed && (
                        <ScoreBox chosenLatLng={{lat: curMarker.current?.getLatLng().lat || 0, long: curMarker.current?.getLatLng().lng || 0}} actualLatLng={{lat: lat, long: long}} ws={ws}></ScoreBox>
                    )
                }
            </div>
        </div>
        
    );
}