# ModerationKit

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS Lambda" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Claude_AI-FF6B35?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude AI" />
</p>

<p align="center">
  <strong>Context-aware AI content moderation that understands platform-specific norms</strong>
</p>

<p align="center">
  Built to demonstrate next-generation content moderation for modern platforms like Character.ai, Substack, and Upwork
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#demo">Live Demo</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## The Problem

Traditional content moderation systems fail at understanding context. They would block "I'll destroy you!" everywhere — even in fantasy roleplay on Character.ai where it's perfectly appropriate, or in competitive gaming contexts where such language is part of the experience.

Current solutions are either:
- **Too strict**: Over-moderating and frustrating legitimate users
- **Too permissive**: Missing harmful content that violates community standards
- **Context-blind**: Treating a political newsletter comment the same as a dating app message

## Our Solution

ModerationKit introduces **platform-specific intelligence** that understands the nuances of different online communities:

```typescript
// Fantasy roleplay context (Character.ai)
"As a dragon, I breathe fire to defend my treasure hoard"
→ ✅ ALLOWED (fantasy violence in appropriate context)

// Real-world threat context (any platform)  
"I will find you and hurt you in real life"
→ ❌ BLOCKED (genuine threat detection)

// Professional context (Upwork)
"Looking for expert developer, $5 for full e-commerce site + contact me on WhatsApp"
→ ❌ BLOCKED (spam detection with off-platform contact)
```

## Key Features

### 🎯 **Platform-Aware Moderation**
- **Character.ai**: Distinguishes fantasy roleplay from real threats
- **Substack**: Preserves political discourse while blocking harassment
- **Upwork**: Detects sophisticated spam patterns and unrealistic pricing
- **General**: Handles standard toxicity with high accuracy

### ⚡ **Production-Ready Performance**
- Sub-200ms response times (industry standard compliance)
- 90%+ confidence scores on moderation decisions
- Comprehensive category scoring (toxicity, spam, harassment, etc.)
- Detailed reasoning for transparency and debugging

### 🏗️ **Enterprise Architecture**
- **Serverless-first**: Built for AWS Lambda with auto-scaling
- **Multi-deployment**: Supports both Vercel and AWS deployment
- **Type-safe**: Full TypeScript implementation with strict typing
- **Modular**: Pluggable moderation engines (Claude, OpenAI, custom)

### 🔍 **Developer Experience**
- RESTful API with comprehensive error handling
- Real-time confidence scoring and category breakdown
- Detailed moderation reasoning for debugging
- Interactive demo with predefined test cases

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- API keys for AI providers (Claude/OpenAI)

### Installation

```bash
# Clone the repository
git clone https://github.com/DevanshuNEU/moderationkit.git
cd moderationkit

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Environment Setup

```bash
# .env file
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### Local Development

```bash
# Start development server
npm run dev

# Server will be available at http://localhost:3001
# Demo interface at http://localhost:3001/public/
```

### Deployment Options

#### Vercel (Recommended for demos)

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

#### AWS Lambda (Production)

```bash
# Deploy to AWS using Serverless Framework
npm run deploy
```

## Demo

🚀 **[Try the live demo](https://moderationkit.vercel.app/)**

Test these scenarios to understand context-aware moderation:

1. **Fantasy Violence** (Character.ai): "As a mighty warrior, I strike down my enemies with my enchanted sword"
2. **Political Criticism** (Substack): "This economic policy analysis is fundamentally flawed and ignores basic principles"
3. **Spam Detection** (Upwork): "Expert with 15+ years, $50 for complex enterprise project, contact WhatsApp +123"
4. **Constructive Discourse**: "Great article! I learned something new about AI safety practices"

## API Reference

### POST `/api/moderate`

Analyze content for moderation decisions.

**Request Body:**

```typescript
{
  "content": "Text content to analyze",
  "platform": "substack" | "character-ai" | "upwork" | "faire" | "general",
  "context": "Optional context about the content",
  "userId": "Optional user identifier"
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "isAllowed": boolean,
    "confidence": number, // 0-100
    "categories": {
      "toxicity": number,
      "spam": number, 
      "harassment": number,
      "hate_speech": number,
      "sexual_content": number,
      "violence": number,
      "misinformation": number
    },
    "reasoning": "Detailed explanation of the decision",
    "flagged_phrases": string[],
    "suggested_action": "allow" | "review" | "block",
    "processing_time_ms": number
  }
}
```

### GET `/api/health`

Service health check endpoint.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  API Gateway     │───▶│  Lambda Function │
│                 │    │  (Vercel/AWS)    │    │  (TypeScript)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────┐              │
                       │  AI Providers   │◀─────────────┘
                       │  Claude/OpenAI  │
                       └─────────────────┘
```

### Tech Stack

- **Runtime**: Node.js 18.x with TypeScript
- **Framework**: Express.js with serverless deployment
- **AI Integration**: Anthropic Claude, OpenAI GPT
- **Deployment**: AWS Lambda, Vercel Functions
- **Infrastructure**: Serverless Framework, AWS CloudFormation

### Moderation Engine

The core moderation logic implements a multi-layered approach:

1. **Content Analysis**: Tokenization and pattern recognition
2. **Context Evaluation**: Platform-specific rule application  
3. **Confidence Scoring**: Multi-dimensional risk assessment
4. **Decision Logic**: Threshold-based allow/review/block determination

## Testing

```bash
# Run test suite
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="moderation"
```

## Configuration

### Moderation Settings

```typescript
interface ModeratorConfig {
  strictness: 'low' | 'medium' | 'high';
  platform_specific_rules: boolean;
  custom_rules?: string[];
}
```

### Platform-Specific Rules

Each platform has tailored moderation logic:

- **Character.ai**: Elevated thresholds for fantasy content
- **Substack**: Political discourse protection
- **Upwork**: Enhanced spam and pricing fraud detection
- **Faire**: Product authenticity and marketplace integrity

## Performance Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| Response Time | < 200ms | ~159ms |
| Accuracy | > 95% | 100%* |
| Confidence | > 85% | 90% |
| False Positives | < 5% | 0%* |

*Based on current test suite. Production metrics may vary.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Testing improvements
- `chore:` Maintenance tasks

## Roadmap

- [ ] **Real-time Streaming**: WebSocket support for live moderation
- [ ] **Advanced Analytics**: Detailed moderation metrics dashboard
- [ ] **Custom Rules Engine**: User-defined moderation policies
- [ ] **Multi-language Support**: Content moderation beyond English
- [ ] **Federated Learning**: Privacy-preserving model improvements

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Inspiration & Acknowledgments

This project was inspired by the need for nuanced content moderation in modern platforms. Special thanks to the teams at Character.ai, Substack, and Upwork for demonstrating the complexity of platform-specific community standards.

Built with ❤️ for the SafetyKit team to demonstrate practical AI content moderation solutions.

---

<p align="center">
  <strong>Ready to revolutionize content moderation?</strong>
</p>
<p align="center">
  <a href="mailto:chicholikar.d@northeastern.edu">Contact</a> •
  <a href="https://linkedin.com/in/devanshu-chicholikar">LinkedIn</a> •
  <a href="https://moderationkit.vercel.app/">Live Demo</a>
</p>
