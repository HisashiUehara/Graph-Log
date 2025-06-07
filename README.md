# Graph-Log AI Assistant 🎤🧠

A sophisticated Voice-Enabled AI Assistant for Field Engineers with RAG (Retrieval-Augmented Generation) capabilities, powered by GraphAI 2.0.5 and OpenAI APIs.

## 🌟 Features

### 🎤 Voice Interface
- **Speech-to-Text**: Real-time voice input using OpenAI Whisper
- **Text-to-Speech**: Audio playback of results using OpenAI TTS
- **Audio Monitoring**: Real-time audio level visualization
- **Multi-language Support**: Japanese and English voice processing

### 🧠 RAG System
- **Automatic Data Ingestion**: All user inputs are automatically stored
- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic search
- **Similarity Search**: Cosine similarity-based document retrieval
- **Context-Aware Responses**: GPT-4 powered responses with relevant context

### 📊 Analysis Modules
- **Simple Analysis**: Basic log processing and template generation
- **Advanced Analysis**: Complex workflow with error detection and reporting
- **Report Generation**: Standalone report creation from analysis data
- **RAG Search**: Query historical data with semantic understanding

### 🎨 Modern UI
- **Shadcn UI Components**: Clean, accessible, and customizable
- **Tailwind CSS**: Responsive design with modern styling
- **Tab Navigation**: Intuitive interface for different functions
- **Real-time Statistics**: Live RAG statistics and user information

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API Key (get from https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HisashiUehara/Graph-Log.git
   cd Graph-Log
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **⚠️ IMPORTANT: Environment Setup**
   
   **You MUST set your OpenAI API key in the .env file:**
   
```bash
   # Edit the .env file and replace the placeholder with your actual API key
   # Open .env file in your editor and change:
   # FROM: OPENAI_API_KEY=your_openai_api_key_here
   # TO:   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   
   **Your .env file should look like this:**
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
npm run dev
```

5. **Access the application**
   - Open http://localhost:3000 (or the next available port)
   - Allow microphone access for voice features

### 🚨 Troubleshooting

**If you see "OPENAI_API_KEY environment variable is missing" error:**

1. Check your .env file exists in the project root
2. Ensure your API key starts with "sk-"
3. Restart the development server after changing .env
4. Make sure there are no spaces around the = sign in .env

**Example of correct .env file:**
```
OPENAI_API_KEY=sk-proj-abcd1234...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + Next.js + TypeScript
- **UI Library**: Shadcn UI + Tailwind CSS
- **AI Framework**: GraphAI 2.0.5
- **AI Services**: OpenAI (GPT-4, Whisper, TTS, Embeddings)
- **Backend**: Next.js API Routes

### Project Structure
```
src/
├── components/
│   ├── ui/                 # Shadcn UI components
│   └── VoiceInterface.tsx  # Voice recording/playback
├── lib/
│   ├── services/           # AI and voice services
│   ├── utils/              # GraphAI manager and utilities
│   └── types/              # TypeScript definitions
├── pages/
│   ├── api/                # API endpoints
│   └── index.tsx           # Main application
├── flows/                  # GraphAI workflow definitions
└── styles/                 # Global styles and Tailwind config
```

## 🔧 API Endpoints

### Core Analysis
- `POST /api/simple-field-engineer` - Basic log analysis
- `POST /api/advanced-field-engineer` - Advanced analysis workflow
- `POST /api/report-generator` - Generate reports from analysis data

### Voice Features
- `POST /api/speech-to-text` - Convert audio to text
- `POST /api/text-to-speech` - Convert text to audio

### RAG System
- `POST /api/rag-search` - Add documents to RAG
- `GET /api/rag-search` - Search similar documents
- `POST /api/rag-response` - Generate RAG-powered responses

## 🎯 Usage Examples

### 1. Voice-Powered Log Analysis
1. Click the microphone button
2. Speak your query: "Analyze this error log for memory issues"
3. Paste or upload your log data
4. Get voice and text results

### 2. RAG-Enhanced Troubleshooting
1. Use the system to analyze various logs over time
2. Switch to RAG Search tab
3. Ask: "What similar memory issues have we seen before?"
4. Get context-aware responses from historical data

### 3. Report Generation
1. Complete a log analysis
2. Switch to Report Generation tab
3. Generate formatted reports for documentation
4. Listen to reports via text-to-speech

## 🔄 GraphAI Workflows

### Simple Analysis Workflow
```json
{
  "logSplitter": "stringSplitterAgent",
  "errorFilter": "propertyFilterAgent", 
  "logAnalysis": "stringTemplateAgent"
}
```

### Advanced Analysis Workflow
```json
{
  "logSplitter": "stringSplitterAgent",
  "errorExtractor": "propertyFilterAgent",
  "analysisEngine": "stringTemplateAgent",
  "knowledgeIntegration": "copyAgent",
  "finalReport": "stringTemplateAgent"
}
```

## 📈 RAG Statistics

The application tracks:
- Total documents stored
- Documents by type (log, query, report, analysis)
- Recent document activity
- User-specific data isolation

## 🛠️ Development

### Adding New Workflows
1. Create JSON workflow in `src/flows/`
2. Add API endpoint in `src/pages/api/`
3. Update UI components as needed

### Extending Voice Features
1. Modify `src/lib/services/speechService.ts`
2. Add new voice commands in `VoiceInterface.tsx`
3. Update API endpoints for new voice features

### Customizing RAG
1. Adjust embedding models in `src/lib/services/ragService.ts`
2. Modify similarity thresholds
3. Add custom document filters

## 🔐 Security & Privacy

- API keys stored in environment variables
- User data isolated by session ID
- No persistent storage (in-memory RAG for demo)
- Voice data processed via OpenAI APIs

## 📚 Documentation

Detailed documentation available in `/docs/`:
- GraphAI concepts and usage
- Agent explanations
- Workflow structure
- API documentation
- Demo examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **GraphAI Team** for the powerful workflow framework
- **OpenAI** for AI services (GPT-4, Whisper, TTS, Embeddings)
- **Shadcn** for the beautiful UI components
- **Vercel** for Next.js framework

## 🔗 Links

- [GraphAI Documentation](https://github.com/receptron/graphai)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Live Demo](http://localhost:3000) (when running locally)

---

**Built with ❤️ for Field Engineers who need intelligent, voice-enabled log analysis and knowledge management.** 