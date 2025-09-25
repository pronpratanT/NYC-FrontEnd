// app/api/auth/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DepartmentTokenManager } from '../../../../../lib/auth/tokenManager';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await DepartmentTokenManager.verifyAndConsumeToken(token);

    if (result.valid && result.payload) {
      return NextResponse.json({
        success: true,
        valid: true,
        departmentId: result.payload.departmentId,
        departmentName: result.payload.departmentName,
        tokenId: result.payload.tokenId,
        message: `Access granted to ${result.payload.departmentName}`
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          valid: false, 
          error: result.error || 'Token verification failed' 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Token verification failed:', error);
    } else {
      console.error('Token verification failed:', error);
    }
    return NextResponse.json(
      { error: 'Failed to verify token', details: message },
      { status: 500 }
    );
  }
}
