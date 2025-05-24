const http = require('http');
const url = require('url');
const { getGeminiResponse, getImagenResponse } = require('./ai_service_http.js'); // Ensure .js extension

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// In-memory store for chat histories by session ID (very basic)
// For a real app, this would need a more robust session mechanism and store.
const chatSessions = {}; 

const parseRequestBody = (req, callback) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            if (body) {
                callback(null, JSON.parse(body));
            } else {
                callback(null, {}); // No body
            }
        } catch (e) {
            callback(e, null); // JSON parsing error
        }
    });
    req.on('error', (err) => {
        console.error('Request error:', err);
        callback(err, null);
    });
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id'); // Allow X-Session-Id
    res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id'); // Expose it to client

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Basic session ID handling from header
    let sessionId = req.headers['x-session-id'];
    if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        console.log("New session ID generated:", sessionId);
    }
    res.setHeader('X-Session-Id', sessionId); // Send session ID back

    if (!chatSessions[sessionId]) {
        chatSessions[sessionId] = []; // Initialize empty history for new session
        console.log("Initialized new chat history for session:", sessionId);
    }


    if (path === '/api/adventure-command' && method === 'POST') {
        parseRequestBody(req, async (err, body) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON in request body', details: err.message }));
                return;
            }
            const { command, theme } = body;
            let currentChatHistory = chatSessions[sessionId];
            console.log(`Adventure command for session ${sessionId}:`, command, 'Theme:', theme, 'History length:', currentChatHistory.length);

            if (!API_KEY) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API_KEY is not configured on the server.' }));
                return;
            }
            if (!command || !theme) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Command and theme are required.' }));
                return;
            }

            try {
                // Pass the current session's chat history
                const aiResult = await getGeminiResponse(API_KEY, theme, command, currentChatHistory);
                chatSessions[sessionId] = aiResult.updatedHistory; // Update session's history

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(aiResult.gameResponse)); // Send only the game response part
            } catch (aiError) {
                console.error('AI Error in adventure-command:', aiError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to get response from AI service.', details: aiError.message }));
            }
        });
    } else if (path === '/api/generate-image' && method === 'POST') {
        parseRequestBody(req, async (err, body) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON in request body', details: err.message }));
                return;
            }
            const { imagePrompt } = body;
            console.log(`Image prompt for session ${sessionId}:`, imagePrompt);

            if (!API_KEY) { // Imagen might use a different key or service, but for now assume same API_KEY context
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API_KEY is not configured on the server.' }));
                return;
            }
             if (!imagePrompt) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'imagePrompt is required.' }));
                return;
            }

            try {
                const imageUrl = await getImagenResponse(API_KEY, imagePrompt);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ imageUrl: imageUrl }));
            } catch (aiError) {
                console.error('AI Error in generate-image:', aiError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to generate image.', details: aiError.message }));
            }
        });
    } else if (path === '/' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Somnium Weavers Zero-Dep API is running. API_KEY loaded: ' + !!API_KEY, sessionCount: Object.keys(chatSessions).length }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Zero-Dependency Server listening on port ${PORT}`);
    if (!API_KEY) {
        console.warn('API_KEY environment variable is not set! AI features will not work.');
    } else {
        console.log('API_KEY loaded.');
    }
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
