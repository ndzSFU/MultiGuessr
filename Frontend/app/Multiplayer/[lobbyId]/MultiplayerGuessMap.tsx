"use client";
import { useEffect, useRef, useState } from "react";
import 'leaflet/dist/leaflet.css';
import type L from "leaflet";

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

import {City} from '../../Map/cities';
import ScoreBox from "../../Map/ScoreBox";
import { Draggable } from "leaflet";

interface MultiplayerGuessMapProps{
    lat: number,
    long: number,
    rerollCity: () => void,
    ws: WebSocket,
    isHost: boolean,
    setLoadGame: (bool: boolean) => void,
    timeHasExpired: boolean,
    setResultsRequested: (bool: boolean) => void,
    setState: (state: "noName" | "lobby" | "error" | "inGame" | "gameOver") => void,
}


export default function MultiplayerGuessMap({lat, long, rerollCity, ws, isHost, setLoadGame, timeHasExpired, setResultsRequested, setState}: MultiplayerGuessMapProps): React.ReactNode{
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const curMarker = useRef<L.Marker<any> | null>(null);
    const [hasGuessed, setHasGuessed] = useState<boolean>(false);
    const hasGuessedRef = useRef<boolean>(false);
    const leafletRef = useRef<typeof L | null>(null);
    const actualMarker = useRef<L.Marker<any> | null>(null);
    const [hasClicked, setHasClicked] = useState<boolean>(false);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [roundOver, setRoundOver] = useState<boolean>(false);

    useEffect(() => {
        hasGuessedRef.current = hasGuessed;
    }, [hasGuessed]);

    useEffect(() => {
        if(timeHasExpired && !hasGuessedRef.current){
            setHasGuessed(true);
            hasGuessedRef.current = true;
            console.log("Times's up!");
            handleGuess();
        }
        
    }, [timeHasExpired])

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
                    if(!hasGuessedRef.current){
                        if(curMarker.current) curMarker.current.remove();
                        curMarker.current = L.marker(e.latlng).addTo(mapRef.current!);
                        setHasClicked(true);
                    }
                    
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
        curMarker.current?.dragging?.disable();
        setHasGuessed(true);
        
        if (leafletRef.current && mapRef.current) {
            const redIcon = leafletRef.current.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });
            actualMarker.current = leafletRef.current.marker([lat, long], {icon: redIcon, draggable: false}).addTo(mapRef.current);
        }
    }

    function handleNext(): void{
        if(curMarker.current){
            curMarker.current.remove();
            curMarker.current = null;
        }

        if (mapRef.current) mapRef.current.setView([0, 0], 1);
        setLoadGame(false);
        setHasGuessed(false);

        ws?.send(JSON.stringify({ method: 'reset'}));
        
        if (isHost) rerollCity();
    }

    function handleGameOver(): void{
        setResultsRequested(true);
        setState("gameOver");
    }

    useEffect(() => {
        if(!ws) return;

        function handleMessage(event: MessageEvent){
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if(data.method === "reset"){
                setLoadGame(false);
                setHasGuessed(false);
            }

            if (data.method === 'finalGuessMade'){
                console.log("Final guess coords");
                for(let i = 0; i < data.roundLatLngs.length; i++){
                    if (leafletRef.current && mapRef.current){
                        //Lat is first, Lng is second
                        //roundLatLngs = [[username, [res.lat, res.lng]], [username, [res.lat, res.lng]], ...]
                        //the first index i is per player, the next index choses username or lat lng, the third index chooses lat or lng (0 = lat)
                        console.log([data.roundLatLngs[i][1][0], data.roundLatLngs[i][1][0]]);
                        leafletRef.current.marker([data.roundLatLngs[i][1][0], data.roundLatLngs[i][1][1]], {draggable: false}).addTo(mapRef.current).bindTooltip(data.roundLatLngs[i][0]).openTooltip();
                    }
                }
                setRoundOver(true);
            }

            if(data.method === "gameOver"){
                console.log("Game Over");
                setGameOver(true);
            }
        }

        ws?.addEventListener("message", handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [ws]);

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
                    (hasGuessed && isHost && roundOver && !gameOver) && (
                        <>
                            <button className="NextBtn" onClick={handleNext} style={{padding: '2px 4px', cursor: 'pointer'}}>Next Round</button> 
                        </>
                    ) 
                } 
                {
                    gameOver && (
                        <>
                            <p style={{ color: '#ef4444' }}>Game Over</p>
                            <button className="gameOverBtn" onClick={handleGameOver} style={{padding: '2px 4px', cursor: 'pointer'}}>See Results</button> 
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