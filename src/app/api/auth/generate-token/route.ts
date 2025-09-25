// app/api/auth/generate-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DepartmentTokenManager } from '../../../../../lib/auth/tokenManager';

export async function POST(request: NextRequest) {
  try {
    const { departmentId, departmentName } = await request.json();

    if (!departmentId || !departmentName) {
      return NextResponse.json(
        { error: 'Department ID and name are required' },
        { status: 400 }
      );
    }

    const tokenData = await DepartmentTokenManager.generateToken(
      parseInt(departmentId),
      departmentName
    );

    return NextResponse.json({
      success: true,
      token: tokenData.token,
      tokenId: tokenData.payload.tokenId,
      departmentId: tokenData.payload.departmentId,
      departmentName: tokenData.payload.departmentName,
      expiresAt: new Date(tokenData.payload.expiresAt).toISOString(),
      message: `Token generated successfully for ${departmentName}`
    });

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Token generation failed:', error);
    } else {
      console.error('Token generation failed:', error);
    }
    return NextResponse.json(
      { error: 'Failed to generate token', details: message },
      { status: 500 }
    );
  }
}






// Cleanup expired tokens
export async function DELETE() {
  try {
    const cleanedCount = await DepartmentTokenManager.cleanupExpiredTokens();
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired tokens`,
      cleanedCount
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to cleanup tokens', details: message },
      { status: 500 }
    );
  }
}

