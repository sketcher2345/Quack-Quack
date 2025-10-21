// apps/host-client/app/components/WinnerAnnouncer.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

interface Submission {
    team_name: string;
    project_title: string;
    github_url: string;
    team: { id: string }; // We need the team ID
}

export default function WinnerAnnouncer({ hackathonId, onWinnersAnnounced }: { hackathonId: string, onWinnersAnnounced: () => void }) {
    const { token } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selections, setSelections] = useState<{ [teamId: string]: string }>({});

    useEffect(() => {
        // This component needs a list of submissions to function
        const fetchSubmissions = async () => {
            if (!token) return;
            try {
                // We'll reuse our submissions export endpoint to get the list
                 const response = await axios.get(`/api/protected/hackathons/${hackathonId}/submissions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // This is a simplified fetch; a real app might have a dedicated endpoint returning JSON
                 const simplifiedSubmissions = response.data.submissionsCsv.split('\n').slice(1).map((row: string) => {
                    const columns = row.split(',');
                    return { project_title: columns[0], team_name: columns[1], github_url: columns[2], team: { id: `team_id_placeholder_${columns[1]}` }};
                 });
                setSubmissions(simplifiedSubmissions); // This is a placeholder parsing.
            } catch (error) {
                console.error("Failed to fetch submissions for winner selection", error);
            } finally {
                setIsLoading(false);
            }
        };
        // In a real app, you would fetch a proper JSON list of submissions, not parse a CSV.
        // For now, let's assume a placeholder.
        setSubmissions([
            { project_title: 'Project Alpha', team_name: 'The A Team', github_url: '#', team: { id: 'team_id_1' } },
            { project_title: 'Project Beta', team_name: 'The B Team', github_url: '#', team: { id: 'team_id_2' } },
            { project_title: 'Project Gamma', team_name: 'The C Team', github_url: '#', team: { id: 'team_id_3' } },
        ]);
        setIsLoading(false);
    }, [token, hackathonId]);

    const handleSelectionChange = (teamId: string, rank: string) => {
        setSelections(prev => {
            const newSelections = { ...prev };
            // Deselect previous team with the same rank if it exists
            Object.keys(newSelections).forEach(key => {
                if (newSelections[key] === rank) {
                    delete newSelections[key];
                }
            });
            if (rank !== 'none') {
                newSelections[teamId] = rank;
            } else {
                delete newSelections[teamId];
            }
            return newSelections;
        });
    };

    const handleSubmitWinners = async () => {
        setIsLoading(true);
        const winners = Object.entries(selections).map(([teamId, rank]) => ({
            teamId,
            rank: parseInt(rank),
        }));
        
        try {
            await axios.post(`/api/protected/hackathons/${hackathonId}/winners`, { winners }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onWinnersAnnounced();
        } catch (error) {
            console.error("Failed to announce winners", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) return <p>Loading submissions...</p>;

    return (
        <Card className="mt-8">
            <CardHeader><CardTitle>Announce Winners</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {submissions.map(sub => (
                    <div key={sub.team.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                            <p className="font-bold">{sub.project_title}</p>
                            <p className="text-sm text-gray-500">{sub.team_name}</p>
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
                <Button onClick={handleSubmitWinners} disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save & Announce Winners'}
                </Button>
            </CardContent>
        </Card>
    );
}