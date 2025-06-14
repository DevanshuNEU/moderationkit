import 'dotenv/config';
import OpenAI from 'openai';
import { ModerationRequest, ModerationResult, ModeratorConfig } from './types';

export class ModerationEngine {
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
      // First, use OpenAI's built-in moderation
      const openaiModeration = await this.openai.moderations.create({
        input: request.content,
      });

      // Then, use our custom LLM analysis for nuanced understanding
      const customAnalysis = await this.customAnalysis(request);

      // Combine results
      const result = this.combineAnalysis(openaiModeration, customAnalysis, request);
      
      result.processing_time_ms = Date.now() - startTime;
      
      return result;
    } catch (error) {
      console.error('Moderation error:', error);
      return this.getErrorResult(startTime);
    }
  }

  private async customAnalysis(request: ModerationRequest) {
    const prompt = this.buildPrompt(request);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert content moderator. Analyze content and respond with a JSON object containing:
          {
            "toxicity_score": 0-100,
            "spam_score": 0-100, 
            "harassment_score": 0-100,
            "reasoning": "detailed explanation",
            "flagged_phrases": ["phrase1", "phrase2"],
            "context_appropriate": true/false
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    try {
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return { toxicity_score: 0, spam_score: 0, harassment_score: 0, reasoning: 'Parse error' };
    }
  }

  private buildPrompt(request: ModerationRequest): string {
    let prompt = `Analyze this ${request.platform || 'general'} content for moderation:\n\n"${request.content}"\n\n`;
    
    if (request.context) {
      prompt += `Context: ${request.context}\n\n`;
    }

    // Platform-specific rules
    if (request.platform === 'substack') {
      prompt += `This is a Substack comment. Consider:
      - Newsletter discussion context
      - Constructive criticism vs harassment
      - Political discourse norms
      - Community engagement value\n\n`;
    }

    prompt += `Consider ${this.config.strictness} strictness level.`;
    
    return prompt;
  }

  private combineAnalysis(openaiResult: any, customResult: any, request: ModerationRequest): ModerationResult {
    const openaiCategories = openaiResult.results[0].categories;
    const openaiScores = openaiResult.results[0].category_scores;

    // Convert scores to 0-100 scale and combine with custom analysis
    const categories = {
      toxicity: Math.max(openaiScores.hate * 100, customResult.toxicity_score || 0),
      spam: customResult.spam_score || 0,
      harassment: Math.max(openaiScores.harassment * 100, customResult.harassment_score || 0),
      hate_speech: openaiScores.hate * 100,
      sexual_content: openaiScores.sexual * 100,
      violence: openaiScores.violence * 100,
      misinformation: customResult.misinformation_score || 0,
    };

    // Calculate overall confidence and decision
    const maxScore = Math.max(...Object.values(categories));
    const isAllowed = this.shouldAllow(maxScore, request.platform);
    const confidence = this.calculateConfidence(categories, customResult);

    return {
      isAllowed,
      confidence,
      categories,
      reasoning: customResult.reasoning || 'Automated analysis',
      flagged_phrases: customResult.flagged_phrases || [],
      suggested_action: this.getSuggestedAction(maxScore, confidence),
      processing_time_ms: 0, // Will be set by caller
    };
  }

  private shouldAllow(maxScore: number, platform?: string): boolean {
    const thresholds = {
      low: 80,
      medium: 60,
      high: 40,
    };

    // Platform-specific adjustments
    let threshold = thresholds[this.config.strictness];
    if (platform === 'character-ai') {
      threshold += 10; // More lenient for roleplay content
    }

    return maxScore < threshold;
  }

  private calculateConfidence(categories: any, customResult: any): number {
    // Higher confidence when multiple signals agree
    const signals = Object.values(categories).filter((score): score is number => typeof score === 'number' && score > 20).length;
    const baseConfidence = customResult.context_appropriate ? 85 : 70;
    
    return Math.min(95, baseConfidence + (signals * 5));
  }

  private getSuggestedAction(maxScore: number, confidence: number): 'allow' | 'review' | 'block' {
    if (maxScore > 80 && confidence > 80) return 'block';
    if (maxScore > 50 || confidence < 70) return 'review';
    return 'allow';
  }

  private getErrorResult(startTime: number): ModerationResult {
    return {
      isAllowed: false,
      confidence: 0,
      categories: {
        toxicity: 0,
        spam: 0,
        harassment: 0,
        hate_speech: 0,
        sexual_content: 0,
        violence: 0,
        misinformation: 0,
      },
      reasoning: 'Analysis failed - defaulting to block for safety',
      suggested_action: 'review',
      processing_time_ms: Date.now() - startTime,
    };
  }
}
