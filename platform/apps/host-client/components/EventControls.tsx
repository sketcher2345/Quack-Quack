// apps/host-client/app/components/EventControls.tsx
"use client";

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Helper function to trigger a file download in the browser
const downloadCsv = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Define a complete type for the hackathon prop
interface Hackathon {
    id: string;
    status: 'UPCOMING' | 'LIVE' | 'ENDED';
    actualStartTime: string | null;
    durationHours: number;
}

// The component now takes an onHackathonStart prop to notify the parent of state changes
export default function EventControls({ hackathon, onHackathonStart }: { hackathon: Hackathon, onHackathonStart: (updatedHackathon: Hackathon) => void}) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleStartHackathon = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`/api/protected/hackathons/${hackathon.id}/start`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onHackathonStart(response.data.hackathon); // Pass the updated hackathon data back to the parent
        } catch (error) {
            console.error("Failed to start hackathon", error);
            // In a real app, you would show an error toast here
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetSubmissions = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/protected/hackathons/${hackathon.id}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            downloadCsv(response.data.submissionsCsv, `submissions-${hackathon.id}.csv`);
        } catch (error) {
            console.error("Failed to get submissions", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate if the hackathon's scheduled duration has passed
    const endTime = hackathon.actualStartTime
        ? new Date(new Date(hackathon.actualStartTime).getTime() + hackathon.durationHours * 60 * 60 * 1000)
        : null;
    const isHackathonOver = endTime ? new Date() > endTime : false;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* STATE 1: Hackathon is upcoming */}
                {hackathon.status === 'UPCOMING' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="default" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? 'Starting...' : 'Start Hackathon Now'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you ready to go live?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will officially start the hackathon for all participants. The timer will begin immediately, and project submissions will be enabled. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Not yet</AlertDialogCancel>
                                <AlertDialogAction onClick={handleStartHackathon}>Yes, Go Live</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                
                {/* STATE 2: Hackathon is currently live */}
                {hackathon.status === 'LIVE' && (
                    <div>
                        <p className="font-semibold text-green-600 mb-2">This hackathon is currently live!</p>
                        {isHackathonOver ? (
                             <p className="text-sm text-gray-500">The scheduled duration is over. You can now export submissions and announce winners.</p>
                        ) : (
                             <p className="text-sm text-gray-500">Ends on: {endTime?.toLocaleString()}</p>
                        )}
                    </div>
                )}

                {/* ACTION: Show submission button if the event is over or has ended */}
                {( (hackathon.status === 'LIVE' && isHackathonOver) || hackathon.status === 'ENDED' ) && (
                    <Button variant="outline" onClick={handleGetSubmissions} disabled={isLoading} className="w-full">
                        {isLoading ? 'Exporting...' : 'Export Submissions CSV'}
                    </Button>
                )}

                {/* STATE 3: Hackathon has officially ended (winners announced) */}
                {hackathon.status === 'ENDED' && (
                     <p className="font-semibold text-gray-500">This hackathon has ended.</p>
                )}
            </CardContent>
        </Card>
    );
}