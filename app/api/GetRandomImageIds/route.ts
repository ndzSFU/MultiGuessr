import { NextResponse } from 'next/server';

export async function GET(){
    const URL: string = 'https://graph.mapillary.com/images?' + 'access_token=' + process.env.MAPILLARY_TOKEN + '&fields=id&bbox=12.967,55.597,13.008,55.607'; 

    const res = await fetch('URL');

    return res.json();
}