import 'dotenv/config';
import OpenAI from 'openai';
import { ModerationRequest, ModerationResult, ModeratorConfig } from './types';

export class SmartModerationEngine {
  private openai: OpenAI;
  private config: ModeratorConfig;

  constructor(config: ModeratorConfig = { strictness: 'medium', platform_specific_rules: true }) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.config = config;
  }

  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    const startTime = Date.now();
    
    try {
      // ONLY use OpenAI Moderation API (cheap: $0.0020 per 1K tokens)
      const moderationResult = await this.openai.moderations.create({
        input: request.content,
      });

      // Add our smart platform-specific logic
      const result = this.enhanceWithPlatformLogic(moderationResult, request);
      result.processing_time_ms = Date.now() - startTime;
      
      return result;
    } catch (error) {
      console.error('Moderation error:', error);
      return this.getErrorResult(startTime);
    }
  }

  private enhanceWithPlatformLogic(openaiResult: any, request: ModerationRequest): ModerationResult {
    const categories = openaiResult.results[0].categories;
    const scores = openaiResult.results[0].category_scores;
    const platform = request.platform || 'general';
    
    // Convert to 0-100 scale
    let enhancedScores = {
      toxicity: scores.hate * 100,
      spam: 0, // We'll calculate this
      harassment: scores.harassment * 100,
      hate_speech: scores.hate * 100,
      sexual_content: scores.sexual * 100,
      violence: scores.violence * 100,
      misinformation: 0, // We'll calculate this
    };

    const flaggedPhrases: string[] = [];
    const content = request.content.toLowerCase();

    // Platform-specific enhancements
    if (platform === 'character-ai') {
      // Roleplay context - reduce violence/hate for fantasy content
      if (request.context?.toLowerCase().includes('roleplay') || 
          request.context?.toLowerCase().includes('fantasy') ||
          content.includes('fictional') ||
          content.includes('dragon') ||
          content.includes('character')) {
        enhancedScores.violence *= 0.2; // Reduce by 80%
        enhancedScores.hate_speech *= 0.3;
        enhancedScores.toxicity *= 0.4;
      }
    }
    
    if (platform === 'upwork') {
      // Business spam detection
      if (content.includes('whatsapp') || content.includes('contact me')) {
        enhancedScores.spam += 60;
        flaggedPhrases.push('off-platform contact');
      }
      
      // Unrealistic pricing
      if ((content.includes('$5') || content.includes('$50')) && 
          (content.includes('project') || content.includes('complete'))) {
        enhancedScores.spam += 40;
        flaggedPhrases.push('unrealistic pricing');
      }
      
      // Too-good-to-be-true
      if (content.includes('expert') && content.includes('years experience') && 
          enhancedScores.spam > 30) {
        enhancedScores.spam += 30;
      }
    }

    if (platform === 'substack') {
      // Political discourse - more lenient on criticism
      if (content.includes('policy') || content.includes('analysis') || 
          request.context?.toLowerCase().includes('political')) {
        enhancedScores.toxicity *= 0.7;
        enhancedScores.harassment *= 0.8;
      }
    }

    // Calculate decision
    const maxScore = Math.max(...Object.values(enhancedScores));
    const isAllowed = maxScore < 60; // Threshold
    const confidence = this.calculateConfidence(enhancedScores, openaiResult.results[0].flagged);
    
    let reasoning = 'Content analyzed using OpenAI moderation with platform-specific intelligence.';
    let suggestedAction: 'allow' | 'review' | 'block' = 'allow';

    if (maxScore > 80) {
      suggestedAction = 'block';
      reasoning = 'Content violates community guidelines with high confidence.';
    } else if (maxScore > 50) {
      suggestedAction = 'review';
      reasoning = 'Content flagged for review due to potential policy violations.';
    }

    if (platform === 'character-ai' && enhancedScores.violence < 20) {
      reasoning += ' Fantasy/roleplay content context considered.';
    }

    return {
      isAllowed,
      confidence,
      categories: enhancedScores,
      reasoning,
      flagged_phrases: flaggedPhrases,
      suggested_action: suggestedAction,
      processing_time_ms: 0,
    };
  }

  private calculateConfidence(scores: any, openaiFlagged: boolean): number {
    const maxScore = Math.max(...Object.values(scores));
    let confidence = 75;
    
    if (openaiFlagged) confidence += 15;
    if (maxScore > 80) confidence += 10;
    if (maxScore < 20) confidence += 5;
    
    return Math.min(95, confidence);
  }

  private getErrorResult(startTime: number): ModerationResult {
    return {
      isAllowed: false,
      confidence: 0,
      categories: {
        toxicity: 0, spam: 0, harassment: 0, hate_speech: 0,
        sexual_content: 0, violence: 0, misinformation: 0,
      },
      reasoning: 'Analysis failed - defaulting to block for safety',
      suggested_action: 'review',
      processing_time_ms: Date.now() - startTime,
    };
  }
}
