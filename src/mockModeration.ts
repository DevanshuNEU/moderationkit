import { ModerationRequest, ModerationResult, ModeratorConfig } from './types';

export class MockModerationEngine {
  private config: ModeratorConfig;

  constructor(config: ModeratorConfig = { strictness: 'medium', platform_specific_rules: true }) {
    this.config = config;
  }

  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    const startTime = Date.now();
    
    // Simulate processing time (realistic for production)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    // Smart analysis based on content and context
    const analysis = this.analyzeContent(request);
    
    const result: ModerationResult = {
      isAllowed: analysis.isAllowed,
      confidence: analysis.confidence,
      categories: analysis.categories,
      reasoning: analysis.reasoning,
      flagged_phrases: analysis.flaggedPhrases,
      suggested_action: analysis.suggestedAction,
      processing_time_ms: Date.now() - startTime,
    };
    
    return result;
  }

  private analyzeContent(request: ModerationRequest) {
    const content = request.content.toLowerCase();
    const platform = request.platform || 'general';
    const context = request.content?.toLowerCase() || '';

    // Initialize scores
    let toxicity = 0;
    let spam = 0;
    let harassment = 0;
    let hate_speech = 0;
    let sexual_content = 0;
    let violence = 0;
    let misinformation = 0;
    
    const flaggedPhrases: string[] = [];

    // Toxicity detection
    const toxicWords = ['idiot', 'stupid', 'garbage', 'trash', 'braindead', 'moron', 'fuck', 'shit', 'bitch', 'asshole', 'damn'];
    const severeWords = ['fuck you', 'motherfucker', 'go fuck yourself', 'kill yourself'];
    
    toxicWords.forEach(word => {
      if (content.includes(word)) {
        toxicity += 30;
        flaggedPhrases.push(word);
      }
    });

    severeWords.forEach(phrase => {
      if (content.includes(phrase)) {
        toxicity += 60;
        harassment += 50;
        flaggedPhrases.push(phrase);
      }
    });

    // Harassment detection  
    const harassmentPatterns = ['you are', 'you\'re a', 'anyone who believes'];
    harassmentPatterns.forEach(pattern => {
      if (content.includes(pattern) && toxicity > 0) {
        harassment += 30;
      }
    });

    // Spam detection (especially for Upwork)
    if (platform === 'upwork') {
      // Unrealistic pricing
      if (content.includes('$5') || content.includes('$50') || content.includes('just $')) {
        spam += 40;
        flaggedPhrases.push('unrealistic pricing');
      }
      
      // Off-platform contact
      if (content.includes('whatsapp') || content.includes('contact me on')) {
        spam += 50;
        flaggedPhrases.push('off-platform contact');
      }
      
      // Too-good-to-be-true claims
      if (content.includes('expert') && (content.includes('15+') || content.includes('10+'))) {
        spam += 30;
      }
    }

    // Violence detection with context awareness
    const violentWords = ['destroy', 'kill', 'burn', 'attack', 'fight'];
    violentWords.forEach(word => {
      if (content.includes(word)) {
        // Context matters!
        if (platform === 'character-ai' && (context.includes('roleplay') || context.includes('fantasy') || content.includes('fictional'))) {
          violence += 5; // Very low score for roleplay
        } else {
          violence += 20;
          flaggedPhrases.push(word);
        }
      }
    });

    // Platform-specific adjustments
    if (platform === 'substack') {
      // Political discourse is more acceptable
      if (content.includes('policy') || content.includes('economics') || content.includes('analysis')) {
        toxicity = Math.max(0, toxicity - 15);
        harassment = Math.max(0, harassment - 15);
      }
    }

    if (platform === 'character-ai') {
      // Fantasy content is acceptable
      if (content.includes('dragon') || content.includes('character') || content.includes('fictional')) {
        violence = Math.max(0, violence - 15);
        toxicity = Math.max(0, toxicity - 10);
      }
    }

    // Calculate overall decision
    const maxScore = Math.max(toxicity, spam, harassment, hate_speech, sexual_content, violence, misinformation);
    
    let isAllowed = true;
    let confidence = 85;
    let reasoning = 'Content appears constructive and appropriate for the platform.';
    let suggestedAction: 'allow' | 'review' | 'block' = 'allow';

    if (maxScore > 70) {
      isAllowed = false;
      suggestedAction = 'block';
      confidence = 92;
      reasoning = 'Content contains clear violations including personal attacks and inappropriate language.';
    } else if (maxScore > 40) {
      isAllowed = false;
      suggestedAction = 'review';
      confidence = 78;
      reasoning = 'Content may violate community guidelines and requires human review.';
    } else if (maxScore > 20) {
      isAllowed = true;
      suggestedAction = 'allow';
      confidence = 88;
      reasoning = 'Content has minor concerns but appears acceptable within community standards.';
    }

    // Special handling for obvious good content
    if (content.includes('great article') || content.includes('thank you') || content.includes('helpful')) {
      isAllowed = true;
      suggestedAction = 'allow';
      confidence = 95;
      reasoning = 'Content is clearly positive and constructive.';
      toxicity = Math.min(5, toxicity);
      harassment = Math.min(5, harassment);
    }

    return {
      isAllowed,
      confidence,
      categories: {
        toxicity,
        spam,
        harassment,
        hate_speech,
        sexual_content,
        violence,
        misinformation,
      },
      reasoning,
      flaggedPhrases,
      suggestedAction,
    };
  }
}
