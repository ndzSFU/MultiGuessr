'use client';

import React, { useEffect } from 'react';
import RenderMapillary from '../Map/renderMapillary';
import './page.css';
import { NextResponse } from 'next/server';

export async function getImageIds(): Promise<any> {
    const URL: string = 'https://graph.mapillary.com/images?' + 'access_token=' + process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN + '&fields=id&bbox=12.967,55.597,13.008,55.607'; 

    const res = await fetch(URL);

    return res.json()
}




const Map: React.FC = () => {

    const [imageIds, setImageIds] = React.useState<string[]>([]);

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

    useEffect(() => {
        getImageIds().then(data => SetAndLogImages(data)).catch(error => console.error('Error fetching image IDs:', error));
    }, []);


    return (
        <div>

            {
                imageIds.length > 0 && (
                    <div className='mapWrapper'>
                        <RenderMapillary accessToken={process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN ?? ''} widthPercent={95} heightPercent={90} imageID={imageIds[320]}/>                
                    </div>
                ) 
                
            }
            
            
        </div>
    );

};

export default Map;

