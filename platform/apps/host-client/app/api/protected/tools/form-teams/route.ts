// apps/host-client/app/api/protected/tools/form-teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        // We receive the file from our client, now we'll forward it to the external AI service
        const externalApiFormData = new FormData();
        externalApiFormData.append('file', file);
        
        // --- IMPORTANT: REPLACE WITH YOUR ACTUAL AI MODEL'S API ENDPOINT ---
        const externalApiUrl = 'https://your-ai-model-api.com/form-teams';
        // ---

        const responseFromAi = await axios.post(externalApiUrl, externalApiFormData, {
            headers: {
                // Add any necessary headers for your AI service, e.g., an API key
                // 'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY}`,
                'Content-Type': 'multipart/form-data',
            },
            // The response should be the raw CSV content
            responseType: 'text' 
        });

        // The AI service should return a CSV string. We will wrap it in JSON for our client.
        return NextResponse.json({ teamsCsv: responseFromAi.data }, { status: 200 });

    } catch (error: any) {
        console.error('Error in form-teams API:', error.response?.data || error.message);
        return NextResponse.json({ message: 'Error communicating with the AI service.' }, { status: 502 }); // 502 Bad Gateway
    }
}