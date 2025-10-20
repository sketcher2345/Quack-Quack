// apps/host-client/app/components/CreateHackathonForm.tsx
"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { type PutBlobResult } from '@vercel/blob';

// Re-using Shadcn components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreateHackathonForm() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const logoFile = logoInputRef.current?.files?.[0];
    const bannerFile = bannerInputRef.current?.files?.[0];

    // Basic client-side check
    if (!logoFile || !bannerFile) {
        setError('Logo and Banner images are required.');
        setIsLoading(false);
        return;
    }

    try {
      // 1. Upload Logo and Banner to Vercel Blob
      const [logoBlob, bannerBlob] = await Promise.all([
        fetch('/api/upload?filename=' + logoFile.name, {
          method: 'POST',
          body: logoFile,
        }).then((res) => res.json() as Promise<PutBlobResult>),
        fetch('/api/upload?filename=' + bannerFile.name, {
          method: 'POST',
          body: bannerFile,
        }).then((res) => res.json() as Promise<PutBlobResult>)
      ]);

      // 2. Prepare data for our protected API
      const hackathonData = {
        name: formData.get('name') as string,
        body: formData.get('body') as string,
        teamSize: parseInt(formData.get('teamSize') as string, 10),
        startDate: new Date(formData.get('startDate') as string).toISOString(),
        durationHours: parseInt(formData.get('durationHours') as string, 10),
        registrationDeadline: new Date(formData.get('registrationDeadline') as string).toISOString(),
        supportEmail: formData.get('supportEmail') as string,
        logoUrl: logoBlob.url, // Use the URL from the blob upload
        bannerUrl: bannerBlob.url,
      };

      // 3. Send data to our protected API endpoint
      const response = await fetch('/api/protected/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send the JWT
        },
        body: JSON.stringify(hackathonData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create hackathon');
      }

      setSuccess('Hackathon created successfully!');
      (event.target as HTMLFormElement).reset(); // Reset form on success
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Hackathon</CardTitle>
        <CardDescription>Fill in the details to launch your next event.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hackathon Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" name="supportEmail" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Participants per Team</Label>
              <Input id="teamSize" name="teamSize" type="number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationHours">Duration (in hours)</Label>
              <Input id="durationHours" name="durationHours" type="number" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="startDate">Start Date and Time</Label>
              <Input id="startDate" name="startDate" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="logo">Logo Image</Label>
                <Input id="logo" name="logo" type="file" ref={logoInputRef} required accept="image/*" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="banner">Banner Image</Label>
                <Input id="banner" name="banner" type="file" ref={bannerInputRef} required accept="image/*" />
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="body">Body/Description (Markdown supported)</Label>
              <Textarea id="body" name="body" required rows={8} />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {success && <p className="text-sm font-medium text-green-600">{success}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Hackathon'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}