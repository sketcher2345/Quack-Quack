// apps/host-client/app/api/protected/hackathons/[hackathonId]/winners/route.ts
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
        const { winners } = await req.json(); // Expecting { winners: [{ teamId: '...', rank: 1 }, ...] }

        // Verify host owns the hackathon
        const hackathon = await prismaClient.hackathon.findFirst({
            where: { id: hackathonId, hostId: hostId }
        });
        if (!hackathon) {
            return NextResponse.json({ message: 'Hackathon not found or access denied' }, { status: 404 });
        }
        
        await prismaClient.$transaction(async (tx) => {
            // 1. Mark the hackathon as ENDED
            await tx.hackathon.update({
                where: { id: hackathonId },
                data: { status: 'ENDED' }
            });
            // 2. Reset all previous ranks for this hackathon
            await tx.team.updateMany({
                where: { hackathonId: hackathonId },
                data: { rank: null }
            });
            // 3. Set the new ranks for the winning teams
            for (const winner of winners) {
                await tx.team.update({
                    where: { id: winner.teamId },
                    data: { rank: winner.rank }
                });
            }
        });

        return NextResponse.json({ message: 'Winners announced successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Error announcing winners:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}