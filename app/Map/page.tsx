'use client';

import React, { useEffect } from 'react';
import RenderMapillary from '../Map/renderMapillary';
import './page.css';
import { NextResponse } from 'next/server';
import {cities, City} from './cities';
import GuessingMap from './GuessingMap';

export async function getImageIds(Lat: number, Lon: number): Promise<any> {

    const bbox_offset: number = 0.005

    //vancouver: Lon: -123.1207 Lat: 49.2827

    const minLon: number = Lon - bbox_offset;
    const maxLon: number = Lon + bbox_offset;

    const minLat: number  =  Lat - bbox_offset; 
    const maxLat: number =  Lat + bbox_offset; 

    const bbox: string = minLon.toString() + "," + minLat.toString() + "," + maxLon.toString() + "," + maxLat.toString();   
    const URL: string = 'https://graph.mapillary.com/images?' + 'access_token=' + process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN + '&fields=id&bbox=' + bbox; 

    const res = await fetch(URL);

    return res.json()
}

function getRandomIdx(array_size: number): number{
    return Math.floor(Math.random() * array_size);
}


const Map: React.FC = () => {

    const [imageIds, setImageIds] = React.useState<string[]>([]);
    const [chosenCitiesIdxs, setChosenCitiesIdxs] = React.useState<number[]>([]);
    const [chosenCity, setChosenCity] = React.useState<City>();

    interface imageID{
        id: string;
    };

    interface imageIdData{
        data: imageID[]
    }


    function SetAndLogImages(data: any){
        console.log(data);

        const dataObj: imageIdData = data;

        setImageIds(dataObj.data.map(dataPoint => dataPoint.id));

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

        getImageIds(cities[idx].lat, cities[idx].long).then(data => SetAndLogImages(data)).catch(error => console.error('Error fetching image IDs:', error));

    }

    useEffect(() => {
        rerollCity();
    }, []);


    return (
        <div>

            {
                imageIds.length > 0 && chosenCity && (
                    <div className='mapWrapper'>
                        <GuessingMap lat={chosenCity.lat} long={chosenCity.long} rerollCity={rerollCity}></GuessingMap> 
                        <RenderMapillary accessToken={process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN ?? ''} widthPercent={55} heightPercent={90} imageID={imageIds[320]}/>                
                    </div>
                ) 
                
            }
            
            
        </div>
    );

};

export default Map;

