// app/api/admin/tokens/route.ts
import { NextResponse } from 'next/server';
import { DepartmentTokenManager } from '../../../../../lib/auth/tokenManager';

// Get all active tokens (admin only)
export async function GET() {
  try {
    const tokens = await DepartmentTokenManager.getAllActiveTokens();
    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to fetch tokens', details: message },
      { status: 500 }
    );
  }
}