// apps/host-client/app/api/protected/hackathons/[hackathonId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface HostJWTPayload {
  hostId: string;
}

// Helper function to get hostId from token
async function getHostIdFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload as unknown as HostJWTPayload).hostId;
  } catch (err) {
    return null;
  }
}

// --- GET Handler: Fetch a single hackathon by its ID ---
export async function GET(req: NextRequest, { params }: { params: { hackathonId: string } }) {
  const hostId = await getHostIdFromToken(req);
  if (!hostId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { hackathonId } = params;

  try {
    const hackathon = await prismaClient.hackathon.findFirst({
      where: {
        id: hackathonId,
        hostId: hostId, // IMPORTANT: Ensures the host owns this hackathon
      },
    });

    if (!hackathon) {
      return NextResponse.json({ message: 'Hackathon not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(hackathon, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// --- PUT Handler: Update a hackathon by its ID ---
export async function PUT(req: NextRequest, { params }: { params: { hackathonId: string } }) {
    const hostId = await getHostIdFromToken(req);
    if (!hostId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { hackathonId } = params;
    const body = await req.json();

    try {
        // This is a safe update: it will only update the record if BOTH the id and the hostId match.
        const updatedHackathon = await prismaClient.hackathon.updateMany({
            where: {
                id: hackathonId,
                hostId: hostId,
            },
            data: {
                name: body.name,
                body: body.body,
                teamSize: body.teamSize,
                startDate: body.startDate,
                durationHours: body.durationHours,
                registrationDeadline: body.registrationDeadline,
                supportEmail: body.supportEmail,
                // Note: We are not allowing logo/banner URL updates for now to keep it simple.
            },
        });

        if (updatedHackathon.count === 0) {
            return NextResponse.json({ message: 'Hackathon not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Hackathon updated successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}