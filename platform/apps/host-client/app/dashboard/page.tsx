// apps/host-client/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no token, redirect to login
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  // While checking for token, show a loading state
  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If we have a token, show the dashboard
  return (
    <div className="p-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Host Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </header>
      <main className="mt-8">
        <p>Welcome, host! This is your protected dashboard.</p>
        {/* The "Create Hackathon" form and list will go here */}
      </main>
    </div>
  );
}