# 🎨 Graph-Log: AI-Powered Field Engineering Assistant

<div align="center">

![Graph-Log Banner](https://img.shields.io/badge/Graph--Log-AI%20Assistant-emerald?style=for-the-badge&logo=robot)

**A sophisticated Voice-Enabled AI Assistant for Field Engineers with RAG capabilities**

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green?style=flat-square&logo=openai)](https://openai.com/)
[![GraphAI](https://img.shields.io/badge/GraphAI-2.0.5-purple?style=flat-square)](https://github.com/receptron/graphai)

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-features) • [🎬 Demo](#-usage-examples) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 What is Graph-Log?

**Graph-Log** is a next-generation AI assistant designed specifically for field engineers who need intelligent, voice-enabled log analysis and knowledge management in their daily operations.

### 🎯 Why Graph-Log?

In the field engineering world, you need:
- ⚡ **Instant Analysis**: Quick insights from complex log data
- 🎤 **Hands-Free Operation**: Voice input when your hands are busy
- 🧠 **Smart Memory**: AI that remembers and learns from your data
- 📊 **Professional Reports**: Generate reports for stakeholders
- 🔍 **Intelligent Search**: Find relevant information from historical data

Graph-Log delivers all of this in a beautiful, modern interface.

---

## ✨ Features

### 🎤 **Voice-First Interface**
- **Speech-to-Text**: Real-time voice input using OpenAI Whisper
- **Text-to-Speech**: Audio playback of analysis results
- **Audio Monitoring**: Live audio level visualization
- **Multi-language Support**: English and Japanese processing

### 🧠 **Advanced RAG System**
- **Automatic Data Ingestion**: All inputs automatically stored and indexed
- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic search
- **Similarity Search**: Cosine similarity-based document retrieval
- **Context-Aware Responses**: GPT-4 powered intelligent responses

### 📊 **Analysis Modules**
- **Simple Analysis**: Quick log processing and insights
- **Report Generation**: Professional reports from analysis data
- **RAG Search**: Query historical data with semantic understanding
- **Hybrid RAG**: Advanced multi-modal knowledge management

### 🎨 **Modern UI/UX**
- **Beautiful Gradient Design**: Eye-catching rainbow gradients with animations
- **Shadcn UI Components**: Clean, accessible, and customizable
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Statistics**: Live RAG statistics and system status

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18+
OpenAI API Key (get from https://platform.openai.com/api-keys)
```

### ⚡ 3-Step Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/HisashiUehara/Graph-Log.git
   cd Graph-Log
   npm install
   ```

2. **⚠️ Setup Environment (CRITICAL)**
   ```bash
   # Create .env file with your OpenAI API key
   echo "OPENAI_API_KEY=sk-your-actual-api-key-here" > .env
   echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env
   echo "NODE_ENV=development" >> .env
   ```

3. **Launch**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

### 🎉 You're Ready!

Visit **http://localhost:3000** and start analyzing logs with AI!

---

## 🎬 Usage Examples

### 1. 🎤 Voice-Powered Log Analysis
```
👤 [Click microphone] "Analyze this memory error log"
🤖 "I found 3 critical memory issues. The system hit 95% memory usage at 14:30..."
🔊 [Plays audio response]
```

### 2. 🧠 Smart Historical Search
```
👤 "What similar network issues have we seen before?"
🤖 "Based on 47 previous logs, I found 3 similar network timeout patterns..."
📈 Shows related incidents with timestamps and solutions
```

### 3. 📊 Automated Report Generation
```
📋 Analyzes: System logs → Memory issues detected
📝 Generates: Professional incident report
📧 Includes: Timeline, root cause, recommendations
```

---

## 🏗️ Architecture

### 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + Next.js + TypeScript | Modern web interface |
| **UI Library** | Shadcn UI + Tailwind CSS | Beautiful, accessible components |
| **AI Framework** | GraphAI 2.0.5 | Workflow orchestration |
| **AI Services** | OpenAI (GPT-4, Whisper, TTS) | Core AI capabilities |
| **Backend** | Next.js API Routes | Serverless API endpoints |

### 📁 Project Structure

```
Graph-Log/
├── src/
│   ├── components/          # UI components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── VoiceInterface.tsx
│   │   └── HybridRAGInterface.tsx
│   ├── lib/
│   │   ├── services/       # AI and voice services
│   │   └── utils/          # Utilities and helpers
│   ├── pages/
│   │   ├── api/           # API endpoints
│   │   ├── index.tsx      # Main application
│   │   └── input-knowledge.tsx
│   └── styles/            # Global styles
├── docs/                  # Documentation
└── README.md
```

---

## 🔧 API Reference

### Core Analysis Endpoints

```typescript
// Simple log analysis
POST /api/simple-field-engineer
{
  "logData": "2024-01-25 ERROR Memory shortage...",
  "query": "What caused this error?",
  "userId": "user_001"
}

// Generate reports
POST /api/report-generator
{
  "analysisData": { /* analysis results */ },
  "reportType": "standard",
  "userId": "user_001"
}
```

### Voice & RAG Endpoints

```typescript
// Speech to text
POST /api/speech-to-text
FormData: { audio: File }

// RAG search
POST /api/rag-search
{
  "query": "network timeout issues",
  "userId": "user_001",
  "useIntelligentSearch": true
}
```

---

## 🎨 Customization

### 🌈 Customize Graph-Log Title

Edit `src/pages/index.tsx` around line 256:

```typescript
// Change colors
background: 'linear-gradient(90deg, 
  #your-color-1 0%, 
  #your-color-2 50%, 
  #your-color-3 100%)'

// Change size
fontSize: '6rem' // Make it bigger or smaller
```

### 🎯 Add Custom Analysis

1. Create new workflow in `src/flows/`
2. Add API endpoint in `src/pages/api/`
3. Update UI components

---

## 🚨 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| ❌ "API key missing" | Check `.env` file has `OPENAI_API_KEY=sk-...` |
| 🔇 No voice input | Allow microphone access in browser |
| 🔄 Build errors | Run `npm install` and restart dev server |
| 🌐 Can't access | Try http://localhost:3000 (not 3001/3002) |

### 🔍 Debug Commands

```bash
# Test API key
node test-api-key.js

# Check environment
npm run dev -- --verbose

# Clear cache
rm -rf .next node_modules
npm install
```

---

## 🎯 Roadmap

### 🔜 Coming Soon
- [ ] **Multi-User Support**: Team collaboration features
- [ ] **Cloud Storage**: Persistent data storage
- [ ] **Mobile App**: React Native companion
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Integration APIs**: Slack, Teams, JIRA integration

### 💡 Feature Requests
Have an idea? [Open an issue](https://github.com/HisashiUehara/Graph-Log/issues) with the `enhancement` label!

---

## 🤝 Contributing

We welcome contributions! 🎉

### 🚀 Quick Contribution Guide

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### 🏷️ Good First Issues
Look for issues labeled `good first issue` or `help wanted`.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Special thanks to:

- **[GraphAI Team](https://github.com/receptron/graphai)** - Powerful workflow framework
- **[OpenAI](https://openai.com)** - GPT-4, Whisper, TTS, and Embeddings APIs
- **[Shadcn](https://ui.shadcn.com)** - Beautiful UI component library
- **[Vercel](https://vercel.com)** - Next.js framework and hosting platform

---

## 🔗 Links & Resources

- 📖 **[Live Demo](http://localhost:3000)** (when running locally)
- 🛠️ **[GraphAI Documentation](https://github.com/receptron/graphai)**
- 🤖 **[OpenAI API Documentation](https://platform.openai.com/docs)**
- 🎨 **[Shadcn UI Components](https://ui.shadcn.com/)**
- 💬 **[Discussions](https://github.com/HisashiUehara/Graph-Log/discussions)**

---

<div align="center">

**Built with ❤️ for Field Engineers who need intelligent, voice-enabled analysis tools**

⭐ **Star this repo if you find it useful!** ⭐

[🐛 Report Bug](https://github.com/HisashiUehara/Graph-Log/issues) • [✨ Request Feature](https://github.com/HisashiUehara/Graph-Log/issues) • [💬 Discussions](https://github.com/HisashiUehara/Graph-Log/discussions)

</div> 