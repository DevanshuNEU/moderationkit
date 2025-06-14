import { VercelRequest, VercelResponse } from '@vercel/node';
import { MockModerationEngine } from '../src/mockModeration';
import { ModerationRequest } from '../src/types';

// Initialize moderation engine
const moderationEngine = new MockModerationEngine({
  strictness: 'medium',
  platform_specific_rules: true,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request: ModerationRequest = req.body;

    // Validate request
    if (!request.content || request.content.trim().length === 0) {
      return res.status(400).json({
        error: 'Content field is required and cannot be empty',
      });
    }

    if (request.content.length > 10000) {
      return res.status(400).json({
        error: 'Content too long. Maximum 10,000 characters allowed.',
      });
    }

    // Process moderation
    const result = await moderationEngine.moderate(request);

    console.log(`Moderation completed: ${result.suggested_action} (${result.confidence}% confidence) in ${result.processing_time_ms}ms`);

    return res.status(200).json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
}
