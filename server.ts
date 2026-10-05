import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3001;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Multi-turn Gemini AI Chat API
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages = [],
        newMessage,
        roleMode = 'general',
        subject = 'Computer Science Curriculum',
        userProfile,
      } = req.body;

      if (!newMessage || typeof newMessage !== 'string') {
        return res.status(400).json({ error: 'A valid newMessage string is required' });
      }

      // Select Gemini model according to system requirement
      // gemini-3.1-pro-preview for complex tasks,
      // gemini-3.5-flash for general tasks,
      // gemini-3.1-flash-lite for fast tasks.
      let selectedModel = 'gemini-3.5-flash';
      let roleTitle = 'SRMS Academic Mentor & Conceptual Guide';
      let roleDirective =
        'Provide comprehensive, student-friendly syllabus explanations with structured examples, memory mnemonics, and AKTU/SRMS exam guidelines.';

      if (roleMode === 'complex') {
        selectedModel = 'gemini-3.1-pro-preview';
        roleTitle = 'SRMS Deep Algorithm & Theoretical Proof Specialist';
        roleDirective =
          'Provide mathematically rigorous derivations, step-by-step proofs (Master Theorem, induction, loop invariants), time/space complexity analysis, and deep technical details.';
      } else if (roleMode === 'fast') {
        selectedModel = 'gemini-3.1-flash-lite';
        roleTitle = 'SRMS Quick Revision & Formula Flashcard Bot';
        roleDirective =
          'Provide lightning-fast, ultra-crisp bullet points, formula summaries, definitions, and high-yield exam takeaways without unnecessary preamble.';
      }

      const systemInstruction = `You are the ${roleTitle} for SRMS College of Engineering & Technology (SRMS Pariksha Portal).
Subject: ${subject}
Student Name: ${userProfile?.name || 'Student'}

Directives:
1. ${roleDirective}
2. Align explanations strictly with standard university Computer Science curricula (DAA, DBMS, Web Tech, Machine Learning, Data Analytics, Constitution of India).
3. Use clean Markdown formatting: headings, bold keywords, numbered procedures, bullet points, and code snippets when beneficial.
4. If writing code, provide clean, idiomatic code with Big-O comments.
5. Offer practical exam time-management advice when relevant.`;

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Safe offline simulation if API key is not yet set in environment
        return res.json({
          reply: `**[Demo Mode - Gemini API Key Required]**\n\nI received your query regarding **${subject}**: "${newMessage}".\n\n*To enable real-time multi-turn generation, add your \`GEMINI_API_KEY\` in the Settings menu.* Here is a key syllabus takeaway for ${subject}: always structure answers with definition, diagram/schema, complexity, and a concrete example!`,
          modelUsed: `${selectedModel} (offline demo)`,
          roleMode,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Transform previous conversation turns into SDK format
      // Role must be 'user' or 'model'
      const formattedHistory = (messages || []).map((msg: { role?: string; sender?: string; text: string }) => {
        const isUser = msg.role === 'user' || msg.sender === 'user';
        return {
          role: isUser ? 'user' : 'model',
          parts: [{ text: msg.text }],
        };
      });

      // Start multi-turn chat session
      const chat = ai.chats.create({
        model: selectedModel,
        history: formattedHistory,
        config: {
          systemInstruction,
        },
      });

      const response = await chat.sendMessage({
        message: newMessage,
      });

      const generatedText = response.text || 'No response generated.';

      return res.json({
        reply: generatedText,
        modelUsed: selectedModel,
        roleMode,
      });
    } catch (error: any) {
      console.error('[API /api/chat Error]:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate response from Gemini API',
        modelAttempted: req.body?.roleMode,
      });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SRMS Pariksha Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
