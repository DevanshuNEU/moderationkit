import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MockModerationEngine } from './mockModeration';
import { ModerationRequest } from './types';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize moderation engine (using mock for demo)
const moderationEngine = new MockModerationEngine({
  strictness: 'medium',
  platform_specific_rules: true,
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ModerationKit API',
    description: 'AI-powered content moderation for SafetyKit demo',
  });
});

app.post('/moderate', async (req, res) => {
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

    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 ModerationKit API running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Demo: Open demo/index.html and update API_ENDPOINT to http://localhost:${port}/moderate`);
});
