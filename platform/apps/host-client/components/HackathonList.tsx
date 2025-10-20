// apps/host-client/app/components/HackathonList.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define a type for the hackathon data we expect from the API
interface Hackathon {
  id: string;
  name: string;
  startDate: string;
  registrationDeadline: string;
  // Add any other fields you want to display
}

export default function HackathonList() {
  const { token } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get('/api/protected/hackathons', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setHackathons(response.data);
      } catch (err) {
        console.error("Failed to fetch hackathons:", err);
        setError('Could not load your hackathons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHackathons();
  }, [token]); // Re-fetch if the token changes

  if (isLoading) {
    return <p>Loading your hackathons...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">My Hackathons</h2>
      {hackathons.length === 0 ? (
        <p>You haven't created any hackathons yet. Fill out the form above to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <Card key={hackathon.id}>
              <CardHeader>
                <CardTitle>{hackathon.name}</CardTitle>
                <CardDescription>
                  Starts: {new Date(hackathon.startDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Registration Closes: {new Date(hackathon.registrationDeadline).toLocaleDateString()}</p>
                  {/* We can add status badges later */}
                  <Badge>Upcoming</Badge> 
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}