// apps/host-client/app/components/RegistrationManager.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react'; // Our icons
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Define types to match our API response
interface User { id: string; name: string | null; email: string; }
interface Participant { user: User; githubUrl: string; }
interface Registration { id: string; teamName: string | null; participants: Participant[]; }

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

export default function RegistrationManager({ hackathonId, isRegistrationOpen }: { hackathonId: string; isRegistrationOpen: boolean }) {
    const { token } = useAuth();
    const [teams, setTeams] = useState<Registration[]>([]);
    const [individuals, setIndividuals] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [regIsOpen, setRegIsOpen] = useState(isRegistrationOpen);

    const fetchRegistrations = async () => {
        if (!token) return;
        try {
            const response = await axios.get(`/api/protected/hackathons/${hackathonId}/registrations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTeams(response.data.teams);
            setIndividuals(response.data.individuals);
        } catch (error) {
            console.error("Failed to fetch registrations", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [token, hackathonId]);

    const handleUpdateStatus = async (registrationId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await axios.put(`/api/protected/registrations/${registrationId}`, { status }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Refresh list on success by removing the acted-upon item
            setTeams(prev => prev.filter(t => t.id !== registrationId));
            setIndividuals(prev => prev.filter(i => i.id !== registrationId));
        } catch (error) {
            console.error(`Failed to ${status.toLowerCase()} registration`, error);
        }
    };
    const handleCloseRegistration = async () => {
        setIsClosing(true);
        try {
            const response = await axios.post(`/api/protected/hackathons/${hackathonId}/close-registration`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const { teamsCsv, individualsCsv } = response.data;
            
            // Trigger downloads
            downloadCsv(teamsCsv, `approved-teams-${hackathonId}.csv`);
            downloadCsv(individualsCsv, `approved-individuals-${hackathonId}.csv`);

            setRegIsOpen(false); // Update UI to reflect closed status
        } catch (error) {
            console.error("Failed to close registration", error);
            // You could add a toast notification here for the error
        } finally {
            setIsClosing(false);
        }
    };

    if (isLoading) return <p>Loading applications...</p>;

    return (
         <div>
            {/* The "Close Registration" Button and Dialog */}
            <div className="flex justify-end mb-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!regIsOpen || isClosing}>
                            {isClosing ? 'Processing...' : (regIsOpen ? 'Close Registration & Export Lists' : 'Registration Closed')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will permanently close registration for this event. You will receive two CSV files containing the lists of all approved teams and individuals. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCloseRegistration}>Yes, close registration</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Card>
                    <CardHeader><CardTitle>Pending Team Applications ({teams.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {teams.length > 0 ? teams.map(reg => (
                            <div key={reg.id} className="p-4 border rounded-md">
                                <h3 className="font-bold text-lg">{reg.teamName}</h3>
                                <ul className="list-disc pl-5 mt-2">
                                    {reg.participants.map(p => <li key={p.user.id}>{p.user.name} ({p.user.email})</li>)}
                                </ul>
                                <div className="flex gap-2 mt-4">
                                    <Button size="icon" variant="outline" className="text-green-500" onClick={() => handleUpdateStatus(reg.id, 'APPROVED')}><Check size={16} /></Button>
                                    <Button size="icon" variant="outline" className="text-red-500" onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}><X size={16} /></Button>
                                </div>
                            </div>
                        )) : <p>No pending team applications.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pending Individual Applications ({individuals.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {individuals.length > 0 ? individuals.map(reg => (
                            <div key={reg.id} className="p-4 border rounded-md">
                                <h3 className="font-bold text-lg">{reg.participants[0]?.user.name}</h3>
                                <p className="text-sm text-gray-500">{reg.participants[0]?.user.email}</p>
                                <a href={reg.participants[0]?.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">GitHub Profile</a>
                                <div className="flex gap-2 mt-4">
                                    <Button size="icon" variant="outline" className="text-green-500" onClick={() => handleUpdateStatus(reg.id, 'APPROVED')}><Check size={16} /></Button>
                                    <Button size="icon" variant="outline" className="text-red-500" onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}><X size={16} /></Button>
                                </div>
                            </div>
                        )) : <p>No pending individual applications.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}