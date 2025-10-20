// apps/host-client/app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // This is where you can add checks, like ensuring the user is authenticated.
        // For now, we'll allow uploads from any authenticated-like session.
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            // You can add any custom metadata here if needed
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // You can perform any actions on the blob after upload here,
        // like saving the URL to your database. For now, we'll do this on the client.
        console.log('Blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The error returned by handleUpload is a 400
    );
  }
}