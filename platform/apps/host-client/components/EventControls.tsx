// apps/host-client/app/components/EventControls.tsx
"use client";

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Define a minimal type for the hackathon prop
interface Hackathon {
    id: string;
    status: 'UPCOMING' | 'LIVE' | 'ENDED';
}

export default function EventControls({ hackathon, onHackathonStart }: { hackathon: Hackathon, onHackathonStart: (updatedHackathon: Hackathon) => void }) {
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
            // You could show an error toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Controls</CardTitle>
            </CardHeader>
            <CardContent>
                {hackathon.status === 'UPCOMING' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
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
                
                {hackathon.status === 'LIVE' && (
                    <p className="font-semibold text-green-600">This hackathon is currently live!</p>
                )}

                {hackathon.status === 'ENDED' && (
                     <p className="font-semibold text-gray-500">This hackathon has ended.</p>
                )}
            </CardContent>
        </Card>
    );
}