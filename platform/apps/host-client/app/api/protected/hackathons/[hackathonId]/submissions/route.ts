// apps/host-client/app/api/protected/hackathons/[hackathonId]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose';
import Papa from 'papaparse';

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

        // Verify host owns the hackathon
        const hackathon = await prismaClient.hackathon.findFirst({
            where: { id: hackathonId, hostId: hostId }
        });
        if (!hackathon) {
            return NextResponse.json({ message: 'Hackathon not found or access denied' }, { status: 404 });
        }

        // Fetch all project submissions for this hackathon
        const submissions = await prismaClient.projectSubmission.findMany({
            where: {
                team: {
                    hackathonId: hackathonId,
                }
            },
            include: {
                team: { // Include team name
                    include: {
                        members: { // Include member emails for contact
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        // Format the data for a clean CSV export
        const submissionsData = submissions.map(sub => ({
            project_title: sub.title,
            team_name: sub.team.name,
            github_url: sub.githubUrl,
            about_project: sub.about,
            problem_statement: sub.problem,
            tech_stack: sub.techStacks.join(', '),
            ai_score: sub.aiScore,
            team_member_emails: sub.team.members.map(m => m.user.email).join(', '),
            submission_date: sub.createdAt,
        }));

        const submissionsCsv = Papa.unparse(submissionsData);

        return NextResponse.json({ submissionsCsv });

    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}