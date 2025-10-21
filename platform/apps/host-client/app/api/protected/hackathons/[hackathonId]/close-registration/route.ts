// apps/host-client/app/api/protected/hackathons/[hackathonId]/close-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose';
import Papa from 'papaparse';

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

        // Use a transaction to ensure all operations succeed or none do.
        const [teams, individuals] = await prismaClient.$transaction(async (tx) => {
            // 1. Verify host owns the hackathon and close registration
            const hackathonUpdateResult = await tx.hackathon.updateMany({
                where: { id: hackathonId, hostId: hostId, isRegistrationOpen: true },
                data: { isRegistrationOpen: false },
            });

            // If no hackathon was updated, it means it didn't exist, host doesn't own it, or it was already closed
            if (hackathonUpdateResult.count === 0) {
                throw new Error('Hackathon not found, access denied, or registration already closed.');
            }

            // 2. Fetch all APPROVED teams for this hackathon
            const approvedTeams = await tx.team.findMany({
                where: { hackathonId: hackathonId },
                include: { members: { include: { user: true } } }
            });

            // 3. Fetch all APPROVED individuals for this hackathon
            const approvedIndividuals = await tx.registration.findMany({
                where: {
                    hackathonId: hackathonId,
                    status: 'APPROVED',
                    teamName: null,
                },
                include: { participants: { include: { user: true } } }
            });

            return [approvedTeams, approvedIndividuals];
        });

        // 4. Format data for CSV conversion
        const teamsData = teams.map(team => ({
            team_name: team.name,
            members_emails: team.members.map(m => m.user.email).join(', '),
            members_names: team.members.map(m => m.user.name).join(', '),
        }));

        const individualsData = individuals.flatMap(reg => reg.participants.map(p => ({
            name: p.user.name,
            email: p.user.email,
            github_url: p.githubUrl,
            college: p.college,
            year: p.year,
        })));
        
        // 5. Convert JSON to CSV strings
        const teamsCsv = Papa.unparse(teamsData);
        const individualsCsv = Papa.unparse(individualsData);

        return NextResponse.json({
            message: 'Registration closed successfully. Your files are ready for download.',
            teamsCsv,
            individualsCsv
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error closing registration:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}