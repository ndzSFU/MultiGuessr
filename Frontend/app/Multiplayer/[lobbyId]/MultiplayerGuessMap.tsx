"use client";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";



import ScoreBox from "../../Map/ScoreBox";

interface MultiplayerGuessMapProps {
    lat: number,
    long: number,
    rerollCity: () => void,
    ws: WebSocket,
    isHost: boolean,
    setLoadGame: (bool: boolean) => void,
    timeHasExpired: boolean,
    team1: string[],
    team2: string[],
    currentUsername: string,
    gameMode: string,
}

export default function MultiplayerGuessMap({ lat, long, rerollCity, ws, isHost, setLoadGame, timeHasExpired, team1, team2, currentUsername, gameMode }: MultiplayerGuessMapProps): React.ReactNode {
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
    const t1Markers = useRef<Map<string, L.Marker<any>>>(new Map());
    const t2Markers = useRef<Map<string, L.Marker<any>>>(new Map());

    let iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png' 

    let iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';


    
    if (gameMode === "knockout" && currentUsername) {
        if (!team1.includes(currentUsername)) {
            iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
        }
    }


    useEffect(() => {
        hasGuessedRef.current = hasGuessed;
    }, [hasGuessed]);

    useEffect(() => {
        if (timeHasExpired && !hasGuessedRef.current) {
            setHasGuessed(true);
            hasGuessedRef.current = true;
            console.log("Times's up!");
            handleGuess();
        }

    }, [timeHasExpired])

    // Create the map only once on mount
    useEffect(() => {
        import('leaflet').then(L => {

            const myIcon = L.icon({
                iconUrl: iconUrl,
                shadowUrl: shadowUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
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
                    if (!hasGuessedRef.current) {
                        if (curMarker.current) curMarker.current.remove();
                        curMarker.current = L.marker(e.latlng, {icon: myIcon}).addTo(mapRef.current!).bindTooltip("Your Guess");
                        setHasClicked(true);
                    }

                    const lat = curMarker.current?.getLatLng().lat;
                    const lng = curMarker.current?.getLatLng().lng;

                    if (ws && gameMode === "knockout") {
                        ws.send(JSON.stringify({ method: 'updateMarkerPos', lat, lng, username: currentUsername }));
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

    function handleGuess(): void {
        console.log("Chosen Coords: " + curMarker.current?.getLatLng());
        console.log("Actual coords: " + lat, long)
        curMarker.current?.dragging?.disable();
        setHasGuessed(true);

    }

    function handleNext(): void {
        if (curMarker.current) {
            curMarker.current.remove();
            curMarker.current = null;
        }

        if (mapRef.current) mapRef.current.setView([0, 0], 1);
        setLoadGame(false);
        setHasGuessed(false);

        ws?.send(JSON.stringify({ method: 'reset' }));

        if (isHost) rerollCity();
    }

    useEffect(() => {
        if (!ws) return;

        function handleMessage(event: MessageEvent) {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.method === "reset") {
                setLoadGame(false);
                setHasGuessed(false);
            }

            if (data.method === "updateMarkerPos" && leafletRef.current && mapRef.current && currentUsername) {

                const updatedMarkerUsername = data.username;

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

                // Helper function to handle the duplicate logic safely
                function updateTeamMarker(
                    teamMarkers: Map<string, L.Marker<any>>,
                    playerUsername: string,
                    playerLat: number,
                    playerLng: number,
                    icon: L.Icon
                ) {
                    console.log("Updating markers!");
                        const oldMarker = teamMarkers.get(playerUsername);

                        if (oldMarker) {
                            oldMarker.remove();
                        }

                        if (!mapRef.current || !leafletRef.current) return;

                        const newMarker = leafletRef.current
                            .marker([playerLat, playerLng], { icon, draggable: false })
                            .addTo(mapRef.current)
                            .bindTooltip(playerUsername)
                            .openTooltip();

                        teamMarkers.set(playerUsername, newMarker); 
                }

                console.log("About to Update Markers")
                if (team1.includes(updatedMarkerUsername) && team1.includes(currentUsername) && updatedMarkerUsername !== currentUsername) {
                    updateTeamMarker(t1Markers.current, updatedMarkerUsername, data.lat, data.lng, blueIcon);
                } else if(team2.includes(updatedMarkerUsername) && team2.includes(currentUsername) &&  updatedMarkerUsername !== currentUsername) {
                    updateTeamMarker(t2Markers.current, updatedMarkerUsername, data.lat, data.lng, redIcon);
                }

            }

            if (data.method === 'finalGuessMade' && leafletRef.current && mapRef.current) {
                console.log("Final guess coords");
                for (let i = 0; i < data.roundLatLngs.length; i++) {



                    //This dispalys where players guessed


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

                    const iconToDisplay = team2.includes(username) ? redIcon : blueIcon;

                    const lat = data.roundLatLngs[i][1][0];

                    const lng = data.roundLatLngs[i][1][1];

                    //Lat is first, Lng is second
                    //roundLatLngs = [[username, [res.lat, res.lng]], [username, [res.lat, res.lng]], ...]
                    //the first index i is per player, the next index choses username or lat lng, the third index chooses lat or lng (0 = lat)
                    console.log([data.roundLatLngs[i][1][0], data.roundLatLngs[i][1][0]]);
                    leafletRef.current.marker([lat, lng], { icon: iconToDisplay, draggable: false }).addTo(mapRef.current).bindTooltip(username).openTooltip();

                }

                const greenIcon = leafletRef.current.icon({
                    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                });
                actualMarker.current = leafletRef.current.marker([lat, long], { icon: greenIcon, draggable: false }).addTo(mapRef.current).bindTooltip("Actual Location").openTooltip();

                setRoundOver(true);
            }

            if (data.method === "gameOver") {
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

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div id="map" ref={divRef} style={{ flex: 1, width: '100%', minHeight: 0 }}></div>
            <div style={{ padding: '4px', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>

                {
                    !hasGuessed && hasClicked && (
                        <button className="GuessBtn" onClick={handleGuess} style={{ padding: '2px 4px', marginRight: '2px', cursor: 'pointer' }}>Guess</button>
                    )
                }

                {
                    (hasGuessed && isHost && roundOver && !gameOver) && (
                        <>
                            <button className="NextBtn" onClick={handleNext} style={{ padding: '2px 4px', cursor: 'pointer' }}>Next Round</button>
                        </>
                    )
                }
                {
                    hasGuessed && (
                        <ScoreBox chosenLatLng={{ lat: curMarker.current?.getLatLng().lat || 0, long: curMarker.current?.getLatLng().lng || 0 }} actualLatLng={{ lat: lat, long: long }} ws={ws}></ScoreBox>
                    )
                }
            </div>
        </div>

    );
}