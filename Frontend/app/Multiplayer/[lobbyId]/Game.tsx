'use client';

import { JSX, useEffect, useRef, useState } from 'react';
import RenderMapillary from '../../Map/renderMapillary';
import { NextResponse } from 'next/server';
import {cities, City} from '../../Map/cities';
import MultiplayerGuessMap from './MultiplayerGuessMap';

async function getImageIds(Lat: number, Lon: number): Promise<any> {

    const bbox_offset: number = 0.005

    //vancouver: Lon: -123.1207 Lat: 49.2827

    const minLon: number = Lon - bbox_offset;
    const maxLon: number = Lon + bbox_offset;

    const minLat: number = Lat - bbox_offset;
    const maxLat: number = Lat + bbox_offset;

    const bbox: string = minLon.toString() + "," + minLat.toString() + "," + maxLon.toString() + "," + maxLat.toString();
    const URL: string = 'https://graph.mapillary.com/images?' + 'access_token=' + process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN + '&fields=id&bbox=' + bbox;

    let res = await fetch(URL);

    const RETRY_MAX = 3;
    let retry_cnt = 0; 

    while(!res.ok && retry_cnt < RETRY_MAX){
        console.log("Trying API again...");
        res = await fetch(URL);
        retry_cnt++;
    }

    console.log("retries: " + retry_cnt);

    return res.json()
}

function getRandomIdx(array_size: number): number{
    return Math.floor(Math.random() * array_size);
}

interface GameProps {
    ws: WebSocket | null;
    isHost: true | false;
    setShowRoundScores: (bool: boolean) => void;
}

function Game({ ws, isHost, setShowRoundScores}: GameProps): JSX.Element {
    const hasInitialized = useRef(false);

    const [imageIds, setImageIds] = useState<string[]>([]);
    const [chosenCitiesIdxs, setChosenCitiesIdxs] = useState<number[]>([]);
    const [chosenCity, setChosenCity] = useState<City>();
    const [startingImageIdx, setStartingImageIdx] = useState<number>();
    const [loadGame, setLoadGame] = useState<boolean>(false);


    const [nextChosenCity, setNextChosenCity] = useState<City>();
    const [nextImageIds, setNextImageIds] = useState<string[]>([]);

    interface imageID{
        id: string;
    };

    interface imageIdData{
        data: imageID[]
    }


    function SetAndLogImages(data: any, city: City){
        console.log(data);

        const dataObj: imageIdData = data;

        const newImageIds = dataObj.data.map(dataPoint => dataPoint.id);

        setImageIds(newImageIds);

        const localStartingImageIdx = getRandomIdx(newImageIds.length);

        ws?.send(JSON.stringify({ method: 'setCity', city: city, imageIds: newImageIds, startingImageIdx: localStartingImageIdx}));

    }

    function rerollCity(): void{
        let idx: number = getRandomIdx(cities.length);

        while(chosenCitiesIdxs.includes(idx, 0)){
            idx = getRandomIdx(cities.length);
        }

        chosenCitiesIdxs.push(idx);

        console.log("Chosen City: " + cities[idx].name)

        console.log("Chosen Cities:" + chosenCitiesIdxs);

        setChosenCity(cities[idx]);

        setImageIds([]);

        getImageIds(cities[idx].lat, cities[idx].long).then(data => SetAndLogImages(data, cities[idx])).catch(error => console.error('Error fetching image IDs:', error));

    }

    useEffect(() => {
        if(!ws) return;

        function handleMessage(event: MessageEvent){
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.method === 'setCity'){
                setShowRoundScores(false);
                setChosenCity(data.city);
                setImageIds(data.imageIds);
                setStartingImageIdx(data.startingImageIdx);
                console.log("Setting city stats: " + data.startingImageIdx);
                setLoadGame(true);
            }
        }

        ws?.addEventListener("message", handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [ws]);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        
        if(isHost) rerollCity();
    }, []);


    return (
        <div className="relative w-full h-full">
            {
                startingImageIdx !== undefined && imageIds.length > 0 && chosenCity && ws && loadGame && (
                    <div className="relative w-full h-full">
                        <div className="absolute inset-0 z-0">
                            <RenderMapillary accessToken={process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN ?? ''} widthPercent={100} heightPercent={100} imageID={imageIds[startingImageIdx]} key={chosenCity.name}/>                
                        </div>
                        <div className="guessing-map-overlay" style={{bottom: '2rem', right: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', overflow: 'hidden'}}>
                            <MultiplayerGuessMap lat={chosenCity.lat} long={chosenCity.long} rerollCity={rerollCity} ws={ws} isHost={isHost} setLoadGame={setLoadGame} key={chosenCity.name}></MultiplayerGuessMap>
                        </div>
                    </div>
                )                 
            }

            {
                imageIds.length == 0 && (
                    <div>
                        Loading Images Please Wait
                    </div>
                )
            }
            
            
        </div>
    );

};

export default Game;

