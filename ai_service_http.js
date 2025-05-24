const https = require('https');
const { getSystemInstruction } = require('./constants_http'); // Assuming constants are moved/created here

// Function to make HTTPS POST requests
const makeHttpsRequest = (options, requestBody) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse JSON response:", data);
                    reject(new Error('Failed to parse JSON response: ' + e.message + '\nResponse: ' + data));
                }
            });
        });

        req.on('error', (e) => {
            console.error("HTTPS request error:", e);
            reject(e);
        });

        if (requestBody) {
            req.write(requestBody);
        }
        req.end();
    });
};

const getGeminiResponse = async (apiKey, theme, command, chatHistory = []) => {
    if (!apiKey) {
        console.error("API Key is missing for Gemini request.");
        return Promise.reject(new Error("API Key is missing."));
    }

    // Gemini API v1beta - Note: v1 is also available. Using v1beta for potential newer features if aligned with user's model.
    // The model "gemini-1.5-flash-001" might be an "alias" that works across API versions,
    // or it might be specific to a version. User mentioned "gemini-1.5-flash-preview-0520"
    // which implies a specific versioning. Let's use a common endpoint structure.
    const hostname = 'generativelanguage.googleapis.com';
    // Model name might need to be `gemini-1.5-flash-latest` or the specific one.
    // For gemini-1.5-flash-001, it's typically fine.
    const path = `/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

    // Construct the messages array from history and current command
    const contents = [...chatHistory];
    if (command) { // Add user's command if present
         contents.push({
            role: "user",
            parts: [{ text: command }]
        });
    }


    const systemInstruction = {
        role: "system", // Or 'user' then 'model' for system prompt if API needs that structure
        parts: [{text: getSystemInstruction(theme) }]
    };
    
    // How system instruction is applied can vary. Some models prefer it in `contents`
    // others have a dedicated `system_instruction` field.
    // For generateContent, it's often part of the `contents` or a specific field.
    // Let's assume `system_instruction` field for now, if not, it should be first in `contents`.
    const requestBody = {
        contents: contents,
        // systemInstruction: systemInstruction, // This might be the correct field for newer models/API versions
        generationConfig: {
            // candidateCount: 1, // Already defaults to 1
            // maxOutputTokens: 8192, // Example
            temperature: 0.9, // Example
            topP: 1, // Example
            // topK: 1, // Example, but often not used with topP
            responseMimeType: "application/json", // Important!
        },
        safetySettings: [ // Example, adjust as needed
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ]
    };
    
    // If systemInstruction is not a top-level field, prepend it to contents
    // For this example, let's try prepending it to contents if `command` is the first user message.
    // This is a common pattern.
    if (chatHistory.length === 0 && command) {
         requestBody.contents = [systemInstruction, ...contents];
    }


    const options = {
        hostname: hostname,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        console.log("Sending to Gemini:", JSON.stringify(requestBody, null, 2));
        const response = await makeHttpsRequest(options, JSON.stringify(requestBody));
        console.log("Received from Gemini (raw):", JSON.stringify(response, null, 2));

        // Extract the text which should be our JSON string
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0] && response.candidates[0].content.parts[0].text) {
            const jsonText = response.candidates[0].content.parts[0].text;
            const parsedGameResponse = JSON.parse(jsonText); // This should be our GeminiApiResponse structure
            
            // Add new AI response to chat history for next turn (model part)
            chatHistory.push({role: "model", parts: [{text: jsonText}]});

            return { gameResponse: parsedGameResponse, updatedHistory: chatHistory };
        } else {
            console.error("Unexpected Gemini response structure:", response);
            throw new Error("Unexpected Gemini response structure. Full response: " + JSON.stringify(response));
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error.message);
        throw error; // Re-throw to be caught by server.js
    }
};

const getImagenResponse = async (apiKey, imagePrompt) => {
    // Placeholder for Imagen REST API call
    // This will require looking up the specific Google Cloud Imagen REST API documentation.
    // It typically involves a different endpoint and request structure.
    console.warn("Imagen API call (getImagenResponse) is a placeholder and not implemented.");
    if (!apiKey || !imagePrompt) {
         console.error("API Key or imagePrompt missing for Imagen.");
         // Return a placeholder or error
         return Promise.resolve("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb25tLWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyI+SW1hZ2VuIFBDUjwvdGV4dD48L3N2Zz4=");
    }
    // Actual implementation would be similar to makeHttpsRequest but with Imagen's specifics.
    return Promise.resolve("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb25tLWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyI+SW1hZ2VuIFBDUjwvdGV4dD48L3N2Zz4="); // Placeholder base64 image
};

module.exports = {
    getGeminiResponse,
    getImagenResponse
};

// Need a constants_http.js for getSystemInstruction
// For now, let's define a placeholder here if constants_http.js isn't created in this step.
// This should ideally be in a separate constants_http.js file.
if (typeof getSystemInstruction === 'undefined') {
    global.getSystemInstruction = (theme) => `You are a game master for a dream exploration game. Theme: ${theme}. Respond in JSON as per GeminiApiResponse. Fields: description, choices (text, action), imagePrompt, fragmentName?, fragmentDescription?, gameOver?`;
}
