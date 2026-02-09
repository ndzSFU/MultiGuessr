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

    useEffect(() => {
        getImageIds().then(data => console.log(data)).catch(error => console.error('Error fetching image IDs:', error));
    }, []);

    return (
        <div>
            <div className='mapWrapper'>
                <RenderMapillary accessToken={process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN ?? ''} widthPercent={95} heightPercent={90}/>

                
            </div>
            
        </div>
    );

};

export default Map;

