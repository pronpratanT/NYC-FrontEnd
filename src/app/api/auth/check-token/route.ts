// app/api/auth/check-token/route.ts
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

    const result = await DepartmentTokenManager.checkTokenStatus(token);

    return NextResponse.json({
      valid: result.valid,
      isUsed: result.isUsed || false,
      payload: result.payload || null,
      error: result.error || null
    });

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
      console.error('Token check failed:', error);
    } else {
      console.error('Token check failed:', error);
    }
    return NextResponse.json(
      { error: 'Failed to check token', details: message },
      { status: 500 }
    );
  }
}