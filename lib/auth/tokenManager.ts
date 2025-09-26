// lib/auth/tokenManager.ts
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

// Redis client setup
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379/1'
});

// Connect to Redis if not already connected
if (!redis.isOpen) {
  redis.connect().catch(console.error);
}

export interface TokenPayload {
  departmentId: number;
  departmentName: string;
  tokenId: string;
  generatedAt: number;
  expiresAt: number;
  isUsed?: boolean;
}

export interface TokenData {
  token: string;
  payload: TokenPayload;
  redisKey: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
const REDIS_PREFIX = 'dept_token:';

export class DepartmentTokenManager {
  
  /**
   * Generate a new JWT token for a specific department
   */
  static async generateToken(departmentId: number, departmentName: string): Promise<TokenData> {
    const tokenId = `${departmentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const expiresAt = now + (TOKEN_EXPIRY * 1000);

    const payload: TokenPayload = {
      departmentId,
      departmentName,
      tokenId,
      generatedAt: now,
      expiresAt,
      isUsed: false
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY
    });

    // Store in Redis
    const redisKey = `${REDIS_PREFIX}${tokenId}`;
    const tokenData = {
      ...payload,
      token,
      createdAt: new Date().toISOString(),
      usedAt: null
    };

    await redis.setEx(redisKey, TOKEN_EXPIRY, JSON.stringify(tokenData));

    console.log(`Generated token for department ${departmentName} (ID: ${departmentId}):`, {
      tokenId,
      redisKey,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return {
      token,
      payload,
      redisKey
    };
  }

  /**
   * Verify and consume a JWT token (one-time use)
   */
  static async verifyAndConsumeToken(token: string): Promise<{
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
  }> {
    try {
      // Verify JWT signature and expiry
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const redisKey = `${REDIS_PREFIX}${decoded.tokenId}`;

      // Check if token exists in Redis
      const redisData = await redis.get(redisKey);
      if (!redisData) {
        return {
          valid: false,
          error: 'Token not found or expired'
        };
      }

      const tokenData = JSON.parse(redisData);

      // Check if token has already been used
      if (tokenData.isUsed || tokenData.usedAt) {
        return {
          valid: false,
          error: 'Token has already been used'
        };
      }

      // Mark token as used
      tokenData.isUsed = true;
      tokenData.usedAt = new Date().toISOString();
      
      // Update Redis with used status
      await redis.setEx(redisKey, TOKEN_EXPIRY, JSON.stringify(tokenData));

      console.log(`Token consumed for department ${decoded.departmentName}:`, {
        tokenId: decoded.tokenId,
        usedAt: tokenData.usedAt
      });

      return {
        valid: true,
        payload: decoded
      };

    } catch (error: unknown) {
      console.error('Token verification failed:', error);
      if (typeof error === 'object' && error !== null && 'name' in error) {
        if ((error as { name?: string }).name === 'JsonWebTokenError') {
          return { valid: false, error: 'Invalid token format' };
        } else if ((error as { name?: string }).name === 'TokenExpiredError') {
          return { valid: false, error: 'Token has expired' };
        }
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Check token status without consuming it
   */
  static async checkTokenStatus(token: string): Promise<{
    valid: boolean;
    payload?: TokenPayload;
    isUsed?: boolean;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const redisKey = `${REDIS_PREFIX}${decoded.tokenId}`;

      const redisData = await redis.get(redisKey);
      if (!redisData) {
        return {
          valid: false,
          error: 'Token not found or expired'
        };
      }

      const tokenData = JSON.parse(redisData);

      return {
        valid: true,
        payload: decoded,
        isUsed: tokenData.isUsed || false
      };

    } catch (error: unknown) {
      let message = 'Token verification failed';
      if (error instanceof Error) {
        message = error.message;
      }
      return {
        valid: false,
        error: message
      };
    }
  }

  /**
   * Revoke a token (mark as used without accessing)
   */
  static async revokeToken(tokenId: string): Promise<boolean> {
    try {
      const redisKey = `${REDIS_PREFIX}${tokenId}`;
      const redisData = await redis.get(redisKey);
      
      if (redisData) {
        const tokenData = JSON.parse(redisData);
        tokenData.isUsed = true;
        tokenData.revokedAt = new Date().toISOString();
        
        await redis.setEx(redisKey, TOKEN_EXPIRY, JSON.stringify(tokenData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to revoke token:', error);
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const pattern = `${REDIS_PREFIX}*`;
      const keys = await redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const tokenData = JSON.parse(data);
          if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
            await redis.del(key);
            cleanedCount++;
          }
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired tokens`);
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get all active tokens for debugging
   */
  static async getAllActiveTokens(): Promise<unknown[]> {
    try {
      const pattern = `${REDIS_PREFIX}*`;
      const keys = await redis.keys(pattern);
      const tokens = [];

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const tokenData = JSON.parse(data);
          tokens.push({
            key,
            ...tokenData,
            token: '***HIDDEN***' // Hide actual token for security
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error('Failed to get active tokens:', error);
      return [];
    }
  }
}

// Export Redis client for other uses if needed
export { redis };