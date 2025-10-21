// apps/host-client/app/dashboard/tools/page.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // We'll need this to select the hackathon

// Helper function for downloading
const downloadCsv = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function AiToolsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedCsv, setGeneratedCsv] = useState<string | null>(null);
    
    // We'll need to fetch the host's hackathons to let them choose which one to register teams for.
    // For now, this is a placeholder. We'll implement the fetch later.
    const [hackathons, setHackathons] = useState<{ id: string, name: string }[]>([]);
    const [selectedHackathon, setSelectedHackathon] = useState<string>('');
    const individualsFileRef = useRef<HTMLInputElement>(null);
    const formedTeamsFileRef = useRef<HTMLInputElement>(null);

    const handleGenerateTeams = async () => {
        const file = individualsFileRef.current?.files?.[0];
        if (!file) {
            setError('Please select the approved individuals CSV file first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedCsv(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/protected/tools/form-teams', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setGeneratedCsv(response.data.teamsCsv);
            downloadCsv(response.data.teamsCsv, 'formed-teams.csv');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate teams.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegisterTeams = async () => {
        const file = formedTeamsFileRef.current?.files?.[0];
        if (!file || !selectedHackathon) {
            setError('Please select a hackathon and the formed teams CSV file.');
            return;
        }
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        
        try {
            await axios.post(`/api/protected/hackathons/${selectedHackathon}/register-formed-teams`, formData, {
                 headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            alert('Teams registered successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register teams.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="p-4 md:p-8">
             <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-4">
                &larr; Back to Dashboard
            </Button>
            <div className="space-y-8">
                {/* Step 1: Generate Teams */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Form Teams from Individuals</CardTitle>
                        <CardDescription>Upload your CSV of approved individuals. Our AI will randomly pair them into teams and generate a new CSV for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="individuals-csv">Approved Individuals File</Label>
                            <Input id="individuals-csv" type="file" accept=".csv" ref={individualsFileRef} />
                        </div>
                        <Button onClick={handleGenerateTeams} disabled={isLoading}>
                            {isLoading ? 'Generating...' : 'Generate Teams CSV'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Step 2: Register Formed Teams */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Register the New Teams</CardTitle>
                        <CardDescription>Upload the `formed-teams.csv` you just downloaded to automatically register them for a hackathon.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Placeholder for hackathon selector */}
                        <div className="space-y-2">
                            <Label>Select Hackathon</Label>
                            <Select onValueChange={setSelectedHackathon} value={selectedHackathon}>
                                <SelectTrigger><SelectValue placeholder="Choose a hackathon..." /></SelectTrigger>
                                <SelectContent>
                                    {/* In a real app, you would fetch and map hackathons here */}
                                    <SelectItem value="placeholder-id">My Awesome Hackathon</SelectItem> 
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="formed-teams-csv">Formed Teams File</Label>
                            <Input id="formed-teams-csv" type="file" accept=".csv" ref={formedTeamsFileRef} />
                        </div>
                        <Button onClick={handleRegisterTeams} disabled={isLoading}>
                            {isLoading ? 'Registering...' : 'Register Teams'}
                        </Button>
                    </CardContent>
                </Card>
                {error && <p className="mt-4 text-destructive font-semibold">{error}</p>}
            </div>
        </main>
    );
}