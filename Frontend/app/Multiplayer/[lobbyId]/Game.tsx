'use client';

import { JSX, useEffect, useRef, useState } from 'react';
import RenderMapillary from '../../Map/renderMapillary';
import { NextResponse } from 'next/server';
import {
    City,
    africa,
    asia,
    canada,
    cities,
    centralAmericaCaribbean,
    europe,
    latinAmerica,
    middleEast,
    na_cities,
    oceania,
    southAmerica,
    usa,
} from '../../Map/cities';
import MultiplayerGuessMap from './MultiplayerGuessMap';
import TimerBox from './TimerBox';

function playAudio(pathToAudio: string): void{
    const audio = new Audio(pathToAudio);
    audio.play();

}

async function getImageIds(Lat: number, Lon: number): Promise<any> {
    const URL: string = process.env.NEXT_PUBLIC_API_BASE_URL + `/api/mapillary-images?lat=${Lat}&lon=${Lon}`;
    console.log("Calling backend...");
    let res = await fetch(URL, {
        headers: { "ngrok-skip-browser-warning": "true" },
    });


    const RETRY_MAX = 5;
    let retry_cnt = 0; 

    while(!res.ok && retry_cnt < RETRY_MAX){
        console.log("Trying backend image cache again...");
        res = await fetch(URL, {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
        retry_cnt++;
    }

    console.log("retries: " + retry_cnt);

    return res.json()
}

function getRandomIdx(array_size: number): number{
    return Math.floor(Math.random() * array_size);
}

function mapRegionToCityArr(region: string): City[]{

    switch(region){
        case "canada":
            return canada;
        case "usa":
            return usa;
        case "na":
            return na_cities;
        case "europe":
            return europe;
        case "southAmerica":
            return southAmerica;
        case "centralAmericaCaribbean":
            return centralAmericaCaribbean;
        case "latinAmerica":
            return latinAmerica;
        case "asia":
            return asia;
        case "middleEast":
            return middleEast;
        case "africa":
            return africa;
        case "oceania":
            return oceania;
        default:
            return cities;
    }
    
}

interface GameProps {
    ws: WebSocket | null,
    isHost: true | false,
    setShowRoundScores: (bool: boolean) => void,
    gameMode: string,
    showRoundScores: boolean,
    setState: (state: "noName" | "lobby" | "error" | "inGame" | "gameOver" | "results") => void,
    region: string,
    setShowScoreCalculations: (bool: boolean) => void,
    setRoundCounter: (value: number | ((prev: number) => number)) => void,
    team1: string[],
    team2: string[],
    currentUsername: string | null,
}

function Game({ ws, isHost, setShowRoundScores, gameMode, showRoundScores, setState, region, setShowScoreCalculations, setRoundCounter, team1, team2, currentUsername}: GameProps): JSX.Element {
    const hasInitialized = useRef(false);
    const [timeHasExpired, setTimeHasExpired] = useState<boolean>(false);
    const failedImageIdsRef = useRef<Set<string>>(new Set());
    const [roundTimerSeconds, setRoundTimerSeconds] = useState<number>(90);
    const [imageIds, setImageIds] = useState<string[]>([]);
    const [chosenCitiesIdxs, setChosenCitiesIdxs] = useState<number[]>([]);
    const [chosenCity, setChosenCity] = useState<City>();
    const [startingImageIdx, setStartingImageIdx] = useState<number>();
    const [loadGame, setLoadGame] = useState<boolean>(false);
    const [firstGuessMade, setFirstGuessMade] = useState<boolean>(false);

    const EMPTY_CITY_RETRY_LIMIT = 8;

    interface imageID{
        id: string;
    };

    interface imageIdData{
        data: imageID[]
    }


    function SetAndLogImages(data: any, city: City, attempt = 0){
        console.log(data);

        const dataObj: imageIdData = data;

        console.log("Chosen City: " + city.name);

        if(!Array.isArray(dataObj?.data) || dataObj.data.length === 0){
            console.warn(`No Mapillary images for ${city.name} (attempt ${attempt + 1})`);

            if(attempt < EMPTY_CITY_RETRY_LIMIT){
                rerollCity(attempt + 1);
            } else {
                console.error('Unable to find a city with images after ' + EMPTY_CITY_RETRY_LIMIT + ' attempts');
            }
            return;
        }

        const newImageIds = dataObj.data.map((entry) => { return entry.toString()});

        setImageIds(newImageIds);

        const localStartingImageIdx = getRandomIdx(newImageIds.length);
        failedImageIdsRef.current.clear();

        ws?.send(JSON.stringify({ method: 'setCity', city: city, imageIds: newImageIds, startingImageIdx: localStartingImageIdx}));

    }

    function rerollCity(attempt = 0): void{

        console.log("region: " + region);

        const city_pool = mapRegionToCityArr(region);

        let idx: number = getRandomIdx(city_pool.length);

        setShowRoundScores(false);
        setTimeHasExpired(false);

        while(chosenCitiesIdxs.includes(idx, 0)){
            idx = getRandomIdx(city_pool.length);
        }

        chosenCitiesIdxs.push(idx);

        console.log("Chosen City: " + city_pool[idx].name)

        console.log("Chosen Cities:" + chosenCitiesIdxs);

        setChosenCity(city_pool[idx]);

        setImageIds([]);
        failedImageIdsRef.current.clear();

        getImageIds(city_pool[idx].lat, city_pool[idx].long).then(data => SetAndLogImages(data, city_pool[idx], attempt)).catch(error => console.error('Error fetching image IDs:', error));

    }

    function handleMapillaryImageError(error: unknown): void {
        console.error('Mapillary image failed, trying next image:', error);

        if (startingImageIdx === undefined || imageIds.length === 0) {
            return;
        }

        const currentImageId = imageIds[startingImageIdx];
        failedImageIdsRef.current.add(currentImageId);

        const nextIdx = imageIds.findIndex((id) => !failedImageIdsRef.current.has(id));

        if (nextIdx === -1) {
            console.error('No valid Mapillary image IDs available for this round');
            setLoadGame(false);
            return;
        }

        setStartingImageIdx(nextIdx);
    }

    useEffect(() => {
        if(!ws) return;

        function handleMessage(event: MessageEvent){
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.method === 'setCity'){
                //Reset prev round states
                setShowScoreCalculations(false);
                setFirstGuessMade(false);
                setShowRoundScores(false);
                setTimeHasExpired(false);
                setChosenCity(data.city);
                setImageIds(data.imageIds);
                setStartingImageIdx(data.startingImageIdx);
                setRoundTimerSeconds(data.timeLimit);
                failedImageIdsRef.current.clear();
                console.log("Setting city stats: " + data.startingImageIdx);
                setRoundCounter((prev: number) =>  prev + 1);
                setLoadGame(true);

            }

            if(data.method === 'guessMade'){
                setFirstGuessMade(true);
                if(gameMode === "knockout"){
                    playAudio("/audio/knockout_timer_begin_alert.mp3")
                }
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
            {loadGame && ( gameMode === "setRounds" || (firstGuessMade && (gameMode === "knockout" || gameMode === "timerTrigger"))) && !showRoundScores && (
                    <TimerBox 
                        seconds={roundTimerSeconds}
                        isActive={loadGame}
                        onExpire={() => setTimeHasExpired(true)}
                       
                    />
            )}
            {
                startingImageIdx !== undefined && imageIds.length > 0 && chosenCity && ws && loadGame && team1 && team2 && currentUsername && gameMode && (
                    <div className="relative w-full h-full">
                        <div className="absolute inset-0 z-0">
                            <RenderMapillary accessToken={process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN ?? ''} widthPercent={100} heightPercent={100} imageID={imageIds[startingImageIdx]} onImageError={handleMapillaryImageError} key={chosenCity.name}/>                
                        </div>
                        <div className="guessing-map-overlay" style={{bottom: '2rem', right: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', overflow: 'hidden'}}>
                            <MultiplayerGuessMap 
                                lat={chosenCity.lat} long={chosenCity.long} 
                                rerollCity={rerollCity} ws={ws} isHost={isHost} 
                                setLoadGame={setLoadGame} timeHasExpired={timeHasExpired} 
                                key={chosenCity.name}
                                team1={team1} team2={team2}
                                currentUsername={currentUsername}
                                gameMode={gameMode}
                                />
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

