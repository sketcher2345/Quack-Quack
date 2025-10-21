// apps/host-client/app/api/protected/hackathons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose'; // We'll use this to get the hostId from the token

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Define a type for our JWT payload
interface HostJWTPayload {
  hostId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Get the token from the Authorization header (already checked by middleware, but we need the payload)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // This should technically be caught by middleware, but it's good practice to double-check
      return NextResponse.json({ message: 'Authorization token not provided' }, { status: 401 });
    }

    // 2. Verify the token and extract the host's ID from the payload
    const { payload } = await jwtVerify(token, secret);
    const hostId = (payload as unknown as HostJWTPayload).hostId;

    if (!hostId) {
      return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 });
    }

    // 3. Parse and Validate the incoming data (Server-Side Validation)
    const body = await req.json();
    const { 
        name, body: description, logoUrl, bannerUrl, teamSize, startDate, 
        durationHours, registrationDeadline, supportEmail 
    } = body;

    if (!name || !description || !logoUrl || !bannerUrl || !teamSize || !startDate || !durationHours || !registrationDeadline || !supportEmail) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 4. Create the Hackathon in the database
    const newHackathon = await prismaClient.hackathon.create({
      data: {
        name,
        body: description,
        logoUrl,
        bannerUrl,
        teamSize,
        startDate: new Date(startDate),
        durationHours,
        registrationDeadline: new Date(registrationDeadline),
        supportEmail,
        hostId: hostId, // Link it to the logged-in host
      },
    });

    return NextResponse.json(newHackathon, { status: 201 }); // 201 Created

  } catch (error) {
    // Handle potential errors, e.g., token verification failure or database errors
    if (error instanceof Error && error.name === 'JWTExpired') {
        return NextResponse.json({ message: 'Token has expired' }, { status: 401 });
    }
    console.error('Error creating hackathon:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Authorization token not provided' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const hostId = (payload as unknown as HostJWTPayload).hostId;

    if (!hostId) {
      return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 });
    }

    // Fetch all hackathons from the database that belong to this host
    const hackathons = await prismaClient.hackathon.findMany({
      where: {
        hostId: hostId,
      },
      orderBy: {
        createdAt: 'desc', // Show the newest ones first
      },
    });

    return NextResponse.json(hackathons, { status: 200 });

  } catch (error) {
    console.error('Error fetching hackathons:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}