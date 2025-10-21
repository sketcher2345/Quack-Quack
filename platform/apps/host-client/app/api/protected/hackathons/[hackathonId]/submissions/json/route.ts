// apps/host-client/app/api/protected/hackathons/[hackathonId]/submissions/json/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
interface HostJWTPayload { hostId: string; }
export async function GET(req: NextRequest, { params }: { params: { hackathonId: string } }) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    try {
        const { payload } = await jwtVerify(token, secret);
        const hostId = (payload as unknown as HostJWTPayload).hostId;
        const { hackathonId } = params;

        const submissions = await prismaClient.projectSubmission.findMany({
            where: {
                team: {
                    hackathonId: hackathonId,
                    hackathon: { hostId: hostId } // Security check
                }
            },
            select: {
                title: true,
                team: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                githubUrl: true
            }
        });

        return NextResponse.json(submissions, { status: 200 });
    } catch (error) {
        console.error('Error fetching JSON submissions:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}