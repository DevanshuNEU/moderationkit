import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ModerationEngine } from './moderation';
import { ModerationRequest } from './types';

const moderationEngine = new ModerationEngine({
  strictness: 'medium',
  platform_specific_rules: true,
});

export const moderate = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Moderation request received:', event.body);

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Request body is required',
          example: {
            content: 'Text to moderate',
            platform: 'substack',
            context: 'Comment on newsletter about AI',
          },
        }),
      };
    }

    const request: ModerationRequest = JSON.parse(event.body);

    // Validate request
    if (!request.content || request.content.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Content field is required and cannot be empty',
        }),
      };
    }

    if (request.content.length > 10000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Content too long. Maximum 10,000 characters allowed.',
        }),
      };
    }

    // Process moderation
    const result = await moderationEngine.moderate(request);

    // Log for analytics (in production, you'd use proper logging/metrics)
    console.log(`Moderation completed: ${result.suggested_action} (${result.confidence}% confidence) in ${result.processing_time_ms}ms`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          request_id: event.requestContext?.requestId,
        },
      }),
    };

  } catch (error) {
    console.error('Moderation error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
      }),
    };
  }
};

export const health = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'ModerationKit API',
      description: 'AI-powered content moderation for SafetyKit demo',
    }),
  };
};
