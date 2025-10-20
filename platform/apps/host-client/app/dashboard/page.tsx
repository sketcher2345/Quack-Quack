// apps/host-client/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import CreateHackathonForm from "@/components/dashboard/CreateHackathonForm";
import HackathonList from "@/components/HackathonList";
export default function DashboardPage() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) {
    return ( <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div> );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Host Dashboard</h1>
        <Button onClick={logout} variant="destructive">Logout</Button>
      </header>
      <main>
        {/* Render the form here */}
        <CreateHackathonForm />
        <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>

        <HackathonList />
        {/* The list of existing hackathons will go below this later */}
      </main>
    </div>
  );
}