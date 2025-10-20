// apps/host-client/app/api/protected/hackathons/[hackathonId]/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface HostJWTPayload {
  hostId: string;
}

// GET Handler to fetch all PENDING registrations for a specific hackathon
export async function GET(req: NextRequest, { params }: { params: { hackathonId: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secret);
    const hostId = (payload as unknown as HostJWTPayload).hostId;
    const { hackathonId } = params;

    // First, verify the host owns the hackathon
    const hackathon = await prismaClient.hackathon.findFirst({
        where: { id: hackathonId, hostId: hostId }
    });
    if (!hackathon) {
        return NextResponse.json({ message: 'Hackathon not found or access denied' }, { status: 404 });
    }

    // Fetch all pending registrations and include participant details
    const pendingRegistrations = await prismaClient.registration.findMany({
      where: {
        hackathonId: hackathonId,
        status: 'PENDING',
      },
      include: {
        participants: { // Get the details of each person in the registration
          include: {
            user: true, // And get their user profile (name, email)
          },
        },
      },
    });

    // Separate into teams and individuals for easier frontend rendering
    const teams = pendingRegistrations.filter(reg => reg.teamName !== null);
    const individuals = pendingRegistrations.filter(reg => reg.teamName === null);

    return NextResponse.json({ teams, individuals }, { status: 200 });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}