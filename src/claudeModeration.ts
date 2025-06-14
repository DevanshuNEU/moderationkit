import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { ModerationRequest, ModerationResult, ModeratorConfig } from './types';

export class ClaudeModerationEngine {
  private anthropic: Anthropic;
  private config: ModeratorConfig;

  constructor(config: ModeratorConfig = { strictness: 'medium', platform_specific_rules: true }) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.config = config;
  }

  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    const startTime = Date.now();
    
    try {
      const analysis = await this.analyzeWithClaude(request);
      const result = this.parseClaudeResponse(analysis, request);
      result.processing_time_ms = Date.now() - startTime;
      
      return result;
    } catch (error) {
      console.error('Claude moderation error:', error);
      return this.getErrorResult(startTime);
    }
  }

  private async analyzeWithClaude(request: ModerationRequest): Promise<string> {
    const prompt = this.buildPrompt(request);
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cheap model
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private buildPrompt(request: ModerationRequest): string {
    const platform = request.platform || 'general';
    const content = request.content;
    const context = request.context || '';

    return `You are an expert content moderator for ${platform}. Analyze this content and respond with ONLY a JSON object.

Content to analyze: "${content}"
Context: "${context}"

Platform-specific guidelines:
${this.getPlatformGuidelines(platform)}

Respond with ONLY this JSON format:
{
  "allowed": true/false,
  "confidence": 0-100,
  "toxicity": 0-100,
  "spam": 0-100,
  "harassment": 0-100,
  "hate_speech": 0-100,
  "sexual_content": 0-100,
  "violence": 0-100,
  "reasoning": "brief explanation",
  "flagged_phrases": ["phrase1", "phrase2"],
  "suggested_action": "allow/review/block"
}`;
  }

  private getPlatformGuidelines(platform: string): string {
    switch (platform) {
      case 'character-ai':
        return `- Roleplay and fantasy content is generally acceptable
- Fictional violence in context is allowed
- Real threats or harassment are not allowed
- Consider the creative/fictional nature`;
        
      case 'substack':
        return `- Political discourse and criticism of ideas is allowed
- Personal attacks on individuals are not allowed
- Constructive debate is encouraged
- Distinguish between criticism and harassment`;
        
      case 'upwork':
        return `- Professional communication expected
- Detect spam: unrealistic pricing (like $5 for complex projects)
- Flag off-platform contact attempts (WhatsApp, etc.)
- Identify fake credentials or too-good-to-be-true claims`;
        
      case 'faire':
        return `- Product descriptions should be authentic
- Flag dropshipping indicators
- Detect misleading product claims
- Professional marketplace standards`;
        
      default:
        return `- General community standards
- No harassment, hate speech, or explicit content
- Allow constructive discussion`;
    }
  }

  private parseClaudeResponse(analysis: string, request: ModerationRequest): ModerationResult {
    try {
      // Extract JSON from Claude's response
      let jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        isAllowed: parsed.allowed,
        confidence: parsed.confidence,
        categories: {
          toxicity: parsed.toxicity,
          spam: parsed.spam,
          harassment: parsed.harassment,
          hate_speech: parsed.hate_speech,
          sexual_content: parsed.sexual_content,
          violence: parsed.violence,
          misinformation: 0, // Could add this later
        },
        reasoning: parsed.reasoning || 'Analysis completed using Claude AI',
        flagged_phrases: parsed.flagged_phrases || [],
        suggested_action: parsed.suggested_action || 'review',
        processing_time_ms: 0, // Will be set by caller
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      console.log('Raw response:', analysis);
      
      // Fallback analysis if JSON parsing fails
      return this.fallbackAnalysis(request, analysis);
    }
  }

  private fallbackAnalysis(request: ModerationRequest, analysis: string): ModerationResult {
    const content = request.content.toLowerCase();
    const isAllowed = !analysis.toLowerCase().includes('block') && 
                     !analysis.toLowerCase().includes('violat');
    
    return {
      isAllowed,
      confidence: 70,
      categories: {
        toxicity: content.includes('fuck') || content.includes('shit') ? 60 : 20,
        spam: request.platform === 'upwork' && content.includes('whatsapp') ? 80 : 10,
        harassment: content.includes('idiot') || content.includes('stupid') ? 50 : 15,
        hate_speech: 20,
        sexual_content: 10,
        violence: content.includes('kill') || content.includes('destroy') ? 40 : 10,
        misinformation: 15,
      },
      reasoning: 'Fallback analysis - Claude response parsing failed',
      flagged_phrases: [],
      suggested_action: isAllowed ? 'allow' : 'review',
      processing_time_ms: 0,
    };
  }

  private getErrorResult(startTime: number): ModerationResult {
    return {
      isAllowed: false,
      confidence: 0,
      categories: {
        toxicity: 0, spam: 0, harassment: 0, hate_speech: 0,
        sexual_content: 0, violence: 0, misinformation: 0,
      },
      reasoning: 'Claude API error - defaulting to block for safety',
      suggested_action: 'review',
      processing_time_ms: Date.now() - startTime,
    };
  }
}
