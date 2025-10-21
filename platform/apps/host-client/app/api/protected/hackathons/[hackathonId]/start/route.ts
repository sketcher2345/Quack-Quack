// apps/host-client/app/api/protected/hackathons/[hackathonId]/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
interface HostJWTPayload { hostId: string; }

export async function POST(req: NextRequest, { params }: { params: { hackathonId: string } }) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { payload } = await jwtVerify(token, secret);
        const hostId = (payload as unknown as HostJWTPayload).hostId;
        const { hackathonId } = params;
        
        // Find the hackathon to ensure the host owns it and it's in the correct state to be started
        const hackathonToStart = await prismaClient.hackathon.findFirst({
            where: {
                id: hackathonId,
                hostId: hostId,
            }
        });

        if (!hackathonToStart) {
            return NextResponse.json({ message: 'Hackathon not found or access denied.' }, { status: 404 });
        }
        
        if (hackathonToStart.status !== 'UPCOMING') {
            return NextResponse.json({ message: `Cannot start a hackathon that is already ${hackathonToStart.status}.` }, { status: 409 }); // 409 Conflict
        }

        // Update the hackathon status to LIVE and set the actual start time
        const startedHackathon = await prismaClient.hackathon.update({
            where: {
                id: hackathonId,
            },
            data: {
                status: 'LIVE',
                actualStartTime: new Date(),
            }
        });

        return NextResponse.json({ message: 'Hackathon successfully started!', hackathon: startedHackathon }, { status: 200 });

    } catch (error) {
        console.error('Error starting hackathon:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}