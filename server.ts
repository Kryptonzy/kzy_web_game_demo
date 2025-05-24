import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {
    createAdventureChat,
    sendAdventureCommand,
    generateAdventureImage,
    isAIServiceInitialized,
    getAIServiceInitializationError,
    GeminiApiResponse
} from './ai_service'; // Path changed
import { Chat } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

let activeChat: Chat | null = null;
let currentTheme: string | null = null;

app.post('/api/adventure-command', async (req: Request, res: Response) => {
    if (!isAIServiceInitialized()) {
        return res.status(500).json({ error: 'AI Service not initialized: ' + getAIServiceInitializationError() });
    }
    const { command, theme } = req.body;
    if (!command) return res.status(400).json({ error: 'Command is required.' });

    try {
        if (theme && theme !== currentTheme || !activeChat) {
            if(theme) currentTheme = theme; else if (!currentTheme) currentTheme = "generic fantasy";
            activeChat = await createAdventureChat(currentTheme!);
            if (!activeChat) return res.status(500).json({ error: 'Failed to create new chat session.' });
        }
        if (!activeChat) return res.status(500).json({ error: 'No active chat session.' }); // Safeguard

        const geminiResponse: GeminiApiResponse | null = await sendAdventureCommand(activeChat, command);
        if (geminiResponse) res.json(geminiResponse);
        else res.status(500).json({ error: 'Failed to get a valid response from AI.' });
    } catch (error) {
        console.error('Error in /api/adventure-command:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.post('/api/generate-image', async (req: Request, res: Response) => {
    if (!isAIServiceInitialized()) {
        return res.status(500).json({ error: 'AI Service not initialized: ' + getAIServiceInitializationError() });
    }
    const { imagePrompt } = req.body;
    if (!imagePrompt) return res.status(400).json({ error: 'imagePrompt is required.' });
    try {
        const base64Image = await generateAdventureImage(imagePrompt);
        if (base64Image) res.json({ imageUrl: base64Image });
        else res.status(500).json({ error: 'Failed to generate image.' });
    } catch (error) {
        console.error('Error in /api/generate-image:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
    if (!isAIServiceInitialized()) {
       console.warn("AI Service failed to initialize: ", getAIServiceInitializationError());
    } else {
       console.log("AI Service initialized successfully.");
    }
});
