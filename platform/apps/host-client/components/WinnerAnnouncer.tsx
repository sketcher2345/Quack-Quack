// apps/host-client/app/components/WinnerAnnouncer.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

// This interface now correctly matches the JSON data from our new API
interface Submission {
    title: string;
    team: {
        id: string;
        name: string;
    };
    githubUrl: string;
}

export default function WinnerAnnouncer({ hackathonId, onWinnersAnnounced }: { hackathonId: string, onWinnersAnnounced: () => void }) {
    const { token } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selections, setSelections] = useState<{ [teamId: string]: string }>({});

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!token) return;
            setIsLoading(true); // Set loading true at the start of the fetch
            try {
                // Fetching from our new, proper JSON endpoint. No more CSV parsing.
                const response = await axios.get(`/api/protected/hackathons/${hackathonId}/submissions/json`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSubmissions(response.data);
            } catch (error) {
                console.error("Failed to fetch submissions for winner selection", error);
                // You could set an error state here to show in the UI
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubmissions();
    }, [token, hackathonId]);

    const handleSelectionChange = (teamId: string, rank: string) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            // Deselect any other team that already has this rank
            Object.keys(newSelections).forEach(key => {
                if (newSelections[key] === rank) {
                    delete newSelections[key];
                }
            });
            // Assign the new rank or remove it if 'none' is selected
            if (rank !== 'none') {
                newSelections[teamId] = rank;
            } else {
                delete newSelections[teamId];
            }
            return newSelections;
        });
    };

    const handleSubmitWinners = async () => {
        setIsSaving(true);
        const winners = Object.entries(selections).map(([teamId, rank]) => ({
            teamId,
            rank: parseInt(rank),
        }));
        
        try {
            await axios.post(`/api/protected/hackathons/${hackathonId}/winners`, { winners }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onWinnersAnnounced(); // Notify the parent page to update its state
        } catch (error) {
            console.error("Failed to announce winners", error);
            // You could set an error state here to show in the UI
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <p className="text-center mt-4">Loading submissions...</p>;
    
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Announce Winners</CardTitle>
                <CardDescription>Review the submitted projects and assign the winning ranks.</CardDescription>
            </CardHeader>
            <CardContent>
                {submissions.length === 0 ? (
                    <p>No project submissions were found for this hackathon.</p>
                ) : (
                    <div className="space-y-4">
                        {submissions.map(sub => (
                            <div key={sub.team.id} className="flex items-center justify-between p-4 border rounded-md">
                                <div>
                                    <p className="font-bold">{sub.title}</p>
                                    <p className="text-sm text-gray-500">{sub.team.name}</p>
                                    <a href={sub.githubUrl}>Link</a>
                                </div>
                                <Select onValueChange={(value) => handleSelectionChange(sub.team.id, value)} value={selections[sub.team.id] || 'none'}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Rank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="1">1st Place</SelectItem>
                                        <SelectItem value="2">2nd Place</SelectItem>
                                        <SelectItem value="3">3rd Place</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                        <Button onClick={handleSubmitWinners} disabled={isSaving || Object.keys(selections).length === 0} className="w-full">
                            {isSaving ? 'Saving...' : 'Save & Announce Winners'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}