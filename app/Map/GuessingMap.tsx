"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "./GuessingMap.css"
import 'leaflet/dist/leaflet.css';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';


interface GuessingMapProps{
    lat: number,
    long: number
}

export default function GuessingMap({lat, long}: GuessingMapProps): React.ReactNode{
    const mapRef = useRef<HTMLDivElement>(null);

    function OnMapClick(e: Event): void{

    }

    useEffect(() => {
        import('leaflet').then(L => {
            

            L.Icon.Default.mergeOptions({
                iconUrl,
                iconRetinaUrl,
                shadowUrl
            });
            if (mapRef.current && !mapRef.current.hasChildNodes()) {
                const map = L.map(mapRef.current).setView([lat, long], 1);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                L.marker([lat, long]).addTo(map);
            }
        });
    }, [lat, long]);

    return(
        <div id="map" ref={mapRef} style={{height: '300px', width: '100%'}}></div>
    );
}