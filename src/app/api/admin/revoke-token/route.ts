// app/api/admin/revoke-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DepartmentTokenManager } from '../../../../../lib/auth/tokenManager';

export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    const revoked = await DepartmentTokenManager.revokeToken(tokenId);

    if (revoked) {
      return NextResponse.json({
        success: true,
        message: `Token ${tokenId} has been revoked`
      });
    } else {
      return NextResponse.json(
        { error: 'Token not found or already revoked' },
        { status: 404 }
      );
    }

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Token revocation failed:', error);
    } else {
      console.error('Token revocation failed:', error);
    }
    return NextResponse.json(
      { error: 'Failed to revoke token', details: message },
      { status: 500 }
    );
  }
}