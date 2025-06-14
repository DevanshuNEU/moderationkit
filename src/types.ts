export interface ModerationRequest {
  content: string;
  context?: string;
  platform?: 'substack' | 'character-ai' | 'upwork' | 'faire' | 'eventbrite';
  userId?: string;
}

export interface ModerationResult {
  isAllowed: boolean;
  confidence: number;
  categories: {
    toxicity: number;
    spam: number;
    harassment: number;
    hate_speech: number;
    sexual_content: number;
    violence: number;
    misinformation: number;
  };
  reasoning: string;
  flagged_phrases?: string[];
  suggested_action: 'allow' | 'review' | 'block';
  processing_time_ms: number;
}

export interface ModeratorConfig {
  strictness: 'low' | 'medium' | 'high';
  platform_specific_rules: boolean;
  custom_rules?: string[];
}
