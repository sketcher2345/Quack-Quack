// apps/host-client/app/api/protected/registrations/[registrationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from 'db/client';
import { jwtVerify } from 'jose';
import { transporter, createApprovalEmail, createRejectionEmail } from '@/lib/nodemailer';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface HostJWTPayload {
  hostId: string;
}

// PUT handler to update a registration's status (APPROVE/REJECT)
export async function PUT(req: NextRequest, { params }: { params: { registrationId: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secret);
    const hostId = (payload as unknown as HostJWTPayload).hostId;
    const { registrationId } = params;
    const { status } = await req.json(); // Expecting { status: 'APPROVED' | 'REJECTED' }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
    }

    // Find the registration to ensure it belongs to a hackathon owned by this host
    const registration = await prismaClient.registration.findFirst({
        where: {
            id: registrationId,
            hackathon: {
                hostId: hostId,
            },
        },
        include: {
            participants: { include: { user: true } },
            hackathon: { select: { name: true } }
        }
    });
    
    if (!registration) {
        return NextResponse.json({ message: 'Registration not found or access denied' }, { status: 404 });
    }

    // Use a transaction to ensure both updates happen or neither do
    await prismaClient.$transaction(async (tx) => {
        // 1. Update the registration status
        await tx.registration.update({
            where: { id: registrationId },
            data: { status: status },
        });

        // 2. If a TEAM is APPROVED, create an official Team record
        if (status === 'APPROVED' && registration.teamName) {
            const newTeam = await tx.team.create({
                data: {
                    name: registration.teamName,
                    hackathonId: registration.hackathonId,
                    // Bio and skills are empty by default as per the project spec
                }
            });

            // 3. Add all the participants from the registration to this new official team
            await tx.teamMember.createMany({
                data: registration.participants.map(p => ({
                    teamId: newTeam.id,
                    userId: p.userId,
                }))
            });
        }
    });

    // We will handle Nodemailer email notifications here in a future step.
    const hackathonName = registration.hackathon.name;
    const recipientEmails = registration.participants.map(p => p.user.email);
    const emailTemplate = status === 'APPROVED' 
        ? createApprovalEmail(hackathonName) 
        : createRejectionEmail(hackathonName);

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: recipientEmails.join(', '), // Nodemailer can send to multiple recipients
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        });
    } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // We log the error but don't fail the request. The host's action was successful.
    }

    return NextResponse.json({ message: `Registration ${status.toLowerCase()}` }, { status: 200 });

  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}