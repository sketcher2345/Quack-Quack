// apps/host-client/app/dashboard/hackathon/[hackathonId]/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';

// Import all necessary UI components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Import our new registration manager component
import RegistrationManager from '@/components/RegistrationManager';

// Helper function to format dates correctly for the <input type="datetime-local">
const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Adjust for timezone offset before converting to ISO string
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};

export default function EditHackathonPage() {
    const { token } = useAuth();
    const router = useRouter();
    const { hackathonId } = useParams();

    // State for the hackathon data form
    const [hackathonData, setHackathonData] = useState({
        name: '', body: '', teamSize: 0, startDate: '', durationHours: 0,
        registrationDeadline: '', supportEmail: '', isRegistrationOpen: true
    });

    // State for loading, updating, and error/success messages
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Effect to fetch the initial hackathon data when the page loads
    useEffect(() => {
        const fetchHackathon = async () => {
            if (!token || !hackathonId) return;
            try {
                const response = await axios.get(`/api/protected/hackathons/${hackathonId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setHackathonData(response.data);
            } catch (err) {
                setError('Failed to load hackathon data. You may not have access or it may not exist.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHackathon();
    }, [token, hackathonId]);
    
    // Handler for changes in the form inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setHackathonData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };

    // Handler for submitting the form to update hackathon details
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.put(`/api/protected/hackathons/${hackathonId}`, hackathonData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSuccess('Hackathon updated successfully! Redirecting to dashboard...');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err) {
            setError('Failed to update hackathon.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading Hackathon Manager...</p></div>;
    }

    if (error && !hackathonData.name) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">{error}</p></div>;
    }

    return (
        <main className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="mb-4">
                &larr; Back to Dashboard
            </Button>
            
            {/* SECTION 1: EDIT HACKATHON DETAILS */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Hackathon</CardTitle>
                    <CardDescription>Editing: {hackathonData.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Hackathon Name</Label>
                                <Input id="name" name="name" value={hackathonData.name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supportEmail">Support Email</Label>
                                <Input id="supportEmail" name="supportEmail" type="email" value={hackathonData.supportEmail} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="teamSize">Participants per Team</Label>
                                <Input id="teamSize" name="teamSize" type="number" value={hackathonData.teamSize} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="durationHours">Duration (in hours)</Label>
                                <Input id="durationHours" name="durationHours" type="number" value={hackathonData.durationHours} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date and Time</Label>
                                <Input id="startDate" name="startDate" type="datetime-local" value={formatDateForInput(hackathonData.startDate)} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                                <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" value={formatDateForInput(hackathonData.registrationDeadline)} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Body/Description (Markdown supported)</Label>
                            <Textarea id="body" name="body" value={hackathonData.body} onChange={handleChange} required rows={8} />
                        </div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        {success && <p className="text-sm font-medium text-green-600">{success}</p>}
                        <Button type="submit" className="w-full" disabled={isUpdating}>
                            {isUpdating ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="my-12 border-t border-gray-200 dark:border-gray-700"></div>

            {/* SECTION 2: MANAGE PARTICIPANT REGISTRATIONS */}
            <h2 className="text-3xl font-bold mb-4">Registration Management</h2>
            <RegistrationManager hackathonId={hackathonId as string} 
                isRegistrationOpen={hackathonData.isRegistrationOpen} />
        </main>
    );
}