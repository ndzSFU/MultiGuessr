"use client";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

import ScoreBox from "../../Map/ScoreBox";

interface MultiplayerGuessMapProps{
    lat: number,
    long: number,
    rerollCity: () => void,
    ws: WebSocket,
    isHost: boolean,
    setLoadGame: (bool: boolean) => void,
    timeHasExpired: boolean,
    setState: (state: "noName" | "lobby" | "error" | "inGame" | "gameOver" | "results") => void,
    team1: string[],
    team2: string[],
}


export default function MultiplayerGuessMap({lat, long, rerollCity, ws, isHost, setLoadGame, timeHasExpired, setState, team1, team2}: MultiplayerGuessMapProps): React.ReactNode{
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

                const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

                const mtLayer = new MaptilerLayer({
                    //Because type of env variable is string | undefined, and apiKey must be just type string
                    apiKey: maptilerKey ? maptilerKey : "AHHHHH",
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

                    

                    //This dispalys where players guessed
                    if (leafletRef.current && mapRef.current){

                        const redIcon = leafletRef.current.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                        });

                        const blueIcon = leafletRef.current.icon({
                            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                        });

                        const username = data.roundLatLngs[i][0];

                        const iconToDisplay = team1.includes(username) ? blueIcon : redIcon;

                        //Lat is first, Lng is second
                        //roundLatLngs = [[username, [res.lat, res.lng]], [username, [res.lat, res.lng]], ...]
                        //the first index i is per player, the next index choses username or lat lng, the third index chooses lat or lng (0 = lat)
                        console.log([data.roundLatLngs[i][1][0], data.roundLatLngs[i][1][0]]);
                        leafletRef.current.marker([data.roundLatLngs[i][1][0], data.roundLatLngs[i][1][1]], {icon: iconToDisplay, draggable: false}).addTo(mapRef.current).bindTooltip(username).openTooltip();
                    }
                }

                if (leafletRef.current && mapRef.current) {
                    

                    const greenIcon = leafletRef.current.icon({
                        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    });
                    actualMarker.current = leafletRef.current.marker([lat, long], {icon: greenIcon, draggable: false}).addTo(mapRef.current).bindTooltip("Actual Location").openTooltip();;
                }
                setRoundOver(true);
            }

            if(data.method === "gameOver"){
                console.log("Game Over");
                console.log(data.scores)
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
                    hasGuessed && (
                        <ScoreBox chosenLatLng={{lat: curMarker.current?.getLatLng().lat || 0, long: curMarker.current?.getLatLng().lng || 0}} actualLatLng={{lat: lat, long: long}} ws={ws}></ScoreBox>
                    )
                }
            </div>
        </div>
        
    );
}