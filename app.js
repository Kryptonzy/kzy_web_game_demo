// Main JavaScript logic for the Somnium Weavers frontend

// Character Stub
const characterName = "Dreamer One";
const currentTheme = "mysterious forest"; // Fixed theme for now

// DOM Elements
let wakingWorldHub;
let dreamScene;
let characterInfoDiv;
let fragmentInventoryDiv;
let enterDreamBtn;
let dreamNarrativeDiv;
let dreamChoicesDiv;
let dreamImageContainer; 
let dreamImageElement;
let returnToWakingBtn;
let clearMemoryBtn; 

// Fragment Inventory
let dreamFragments = []; // Loaded from localStorage
let currentSessionId = null; 

// For Task 7.2: Remember Memory
let currentFullDreamLog = { 
    initialDescription: "", 
    events: [], // Will store objects like { choiceText: "...", resultingDescription: "...", fragmentAwarded: null/object }
    finalOutcomeDescription: "", // The very last narrative text seen
    timestamp: null 
};


// --- Initialization and DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
    wakingWorldHub = document.getElementById('waking-world-hub');
    dreamScene = document.getElementById('dream-scene');
    characterInfoDiv = document.getElementById('character-info');
    fragmentInventoryDiv = document.getElementById('fragment-inventory');
    enterDreamBtn = document.getElementById('enter-dream-btn');
    dreamNarrativeDiv = document.getElementById('dream-narrative');
    dreamChoicesDiv = document.getElementById('dream-choices');
    dreamImageContainer = document.getElementById('dream-image-container');
    dreamImageElement = document.getElementById('dream-image');
    returnToWakingBtn = document.getElementById('return-to-waking-world-btn');
    clearMemoryBtn = document.getElementById('clear-memory-btn');

    // Load saved fragments
    const savedFragments = localStorage.getItem('dreamFragments');
    if (savedFragments) {
        dreamFragments = JSON.parse(savedFragments);
    }
    
    // Initial display updates
    displayCharacterInfo();
    displayFragments();

    // Event Listeners
    if (enterDreamBtn) {
        enterDreamBtn.addEventListener('click', startAIDream);
    }
    if (returnToWakingBtn) {
        returnToWakingBtn.addEventListener('click', transitionToWakingWorld);
    }
    if (clearMemoryBtn) { 
        clearMemoryBtn.addEventListener('click', clearAllFragments);
    }
});

// --- Waking World Functions ---
function displayCharacterInfo() { /* ... (no change) ... */ 
    if (characterInfoDiv) {
        characterInfoDiv.textContent = `Character: ${characterName}`;
    }
}
function displayFragments() { /* ... (no change) ... */ 
    if (fragmentInventoryDiv) {
        fragmentInventoryDiv.innerHTML = ''; 
        if (dreamFragments.length === 0) {
            fragmentInventoryDiv.textContent = "No fragments collected yet.";
        } else {
            const ul = document.createElement('ul');
            dreamFragments.forEach(fragment => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${fragment.name}</strong>: ${fragment.description}`;
                ul.appendChild(li);
            });
            fragmentInventoryDiv.appendChild(ul);
        }
    }
}
function awardFragment(name, description) { /* ... (no change) ... */ 
    if (name && typeof name === 'string' && name.trim() !== "" && description && typeof description === 'string') {
        const fragment = { name: name.trim(), description: description.trim() };
        if (!dreamFragments.some(df => df.name === fragment.name)) {
            dreamFragments.push(fragment);
            displayFragments();
            localStorage.setItem('dreamFragments', JSON.stringify(dreamFragments));
            console.log("Fragment awarded:", fragment.name);
        } else {
            console.log("Fragment already collected:", fragment.name);
        }
    } else {
        console.warn("Attempted to award invalid fragment:", name, description);
    }
}
function clearAllFragments() { /* ... (no change) ... */ 
    if (confirm("Are you sure you want to erase all collected dream fragments? This action cannot be undone.")) {
        dreamFragments = [];
        localStorage.removeItem('dreamFragments');
        displayFragments(); 
        alert("All dream fragments have been cleared."); 
        console.log("All fragments cleared by user.");
    }
}

// --- Scene Transition Functions ---
function transitionToDreamScene() { /* ... (no change, image handling already present) ... */ 
    if (wakingWorldHub) wakingWorldHub.style.display = 'none';
    if (dreamScene) dreamScene.style.display = 'block';
    if (returnToWakingBtn) returnToWakingBtn.style.display = 'none';
    if (dreamImageElement) dreamImageElement.style.display = 'none'; 
    if (dreamImageElement) dreamImageElement.src = '#'; 
    if (dreamImageContainer) dreamImageContainer.style.display = 'none'; 
    if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = ''; 
    if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = 'Connecting to the dream world...';
}

// Modified for Task 7.2
function transitionToWakingWorld() {
    // Prompt to save dream before clearing details
    if (currentFullDreamLog && (currentFullDreamLog.initialDescription || currentFullDreamLog.events.length > 0)) {
        currentFullDreamLog.finalOutcomeDescription = dreamNarrativeDiv ? dreamNarrativeDiv.textContent : "The dream ended."; // Capture final text
        if (confirm("Would you like to remember this dream journey as a Markdown file?")) {
            generateAndDownloadMarkdown(currentFullDreamLog);
        }
    }
    // Reset dream log for next session
    currentFullDreamLog = { initialDescription: "", events: [], finalOutcomeDescription: "", timestamp: null };

    // Existing transition logic
    if (dreamScene) dreamScene.style.display = 'none';
    if (wakingWorldHub) wakingWorldHub.style.display = 'block';
    if (dreamNarrativeDiv) dreamNarrativeDiv.innerHTML = '';
    if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = '';
    if (dreamImageElement) {
        dreamImageElement.src = '#'; 
        dreamImageElement.style.display = 'none';
    }
    if (dreamImageContainer) dreamImageContainer.style.display = 'none';
    if (returnToWakingBtn) returnToWakingBtn.style.display = 'none';
    console.log("Transitioned back to Waking World.");
}

// --- AI Dream Functions ---
async function fetchAIData(payload) { /* ... (no change from Task 6.2) ... */ 
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    };
    if (currentSessionId) {
        fetchOptions.headers['X-Session-Id'] = currentSessionId;
    }

    try {
        dreamNarrativeDiv.textContent = "The dream is materializing...";
        dreamChoicesDiv.innerHTML = ''; 

        const response = await fetch('/api/adventure-command', fetchOptions);

        const newSessionId = response.headers.get('X-Session-Id');
        if (newSessionId) {
            currentSessionId = newSessionId;
            console.log("Session ID updated/received:", currentSessionId);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Network response was not ok: ${response.status}. ${errorData.error || errorData.message}`);
        }
        
        const data = await response.json();
        displayAIDreamContent(data, payload.command === "start"); // Pass if it's the start

    } catch (error) {
        console.error('Error fetching AI data:', error);
        if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = `Error connecting to the dream: ${error.message}. Try returning to the waking world and entering again.`;
        if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = '';
        if (returnToWakingBtn) returnToWakingBtn.style.display = 'block'; 
    }
}

// Modified for Task 7.2
async function startAIDream() {
    console.log("Attempting to start AI dream...");
    transitionToDreamScene();
    // Reset log for a new dream
    currentFullDreamLog = { initialDescription: "", events: [], finalOutcomeDescription: "", timestamp: new Date().toISOString() };
    await fetchAIData({ command: "start", theme: currentTheme });
}

async function fetchAndDisplayImage(imagePrompt) { /* ... (no change from Task 6.2) ... */ 
    if (!dreamImageElement || !dreamImageContainer) return;

    console.log("Fetching image for prompt:", imagePrompt);
    dreamImageElement.src = '#'; 
    dreamImageElement.style.display = 'none';
    dreamImageContainer.style.display = 'block'; 

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePrompt: imagePrompt })
    };
    if (currentSessionId) { 
        fetchOptions.headers['X-Session-Id'] = currentSessionId;
    }

    try {
        const response = await fetch('/api/generate-image', fetchOptions);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Image generation failed: ${response.status}. ${errorData.error || errorData.message}`);
        }
        const data = await response.json();
        if (data.imageUrl) {
            dreamImageElement.src = data.imageUrl;
            dreamImageElement.style.display = 'block';
            dreamImageContainer.style.display = 'block'; 
        } else {
            console.error('No imageUrl in response from /api/generate-image');
            dreamImageElement.style.display = 'none'; 
        }
    } catch (error) {
        console.error('Error fetching or displaying image:', error);
        dreamImageElement.src = '#'; 
        dreamImageElement.style.display = 'none'; 
    }
}

// Modified for Task 7.2
function displayAIDreamContent(data, isInitialDreamStart = false) {
    if (!data) {
        dreamNarrativeDiv.textContent = "The dream dissipates into nothingness. Perhaps try again?";
        if (returnToWakingBtn) returnToWakingBtn.style.display = 'block';
        if (dreamImageElement) dreamImageElement.style.display = 'none';
        if (dreamImageContainer) dreamImageContainer.style.display = 'none';
        currentFullDreamLog.finalOutcomeDescription = dreamNarrativeDiv.textContent; // Log this outcome
        return;
    }

    if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = data.description;

    if (isInitialDreamStart) {
        currentFullDreamLog.initialDescription = data.description;
        currentFullDreamLog.events = []; // Ensure events are reset for a new dream
    } else {
        // This is a result of a choice. The choice text was stored in handleAIChoice.
        // Now store the resulting description.
        const lastEvent = currentFullDreamLog.events[currentFullDreamLog.events.length - 1];
        if (lastEvent && !lastEvent.resultingDescription) {
            lastEvent.resultingDescription = data.description;
        } else if (!lastEvent && currentFullDreamLog.events.length === 0 && !currentFullDreamLog.initialDescription) {
            // This case might happen if a dream starts without a clear "start" command path
            // For simplicity, we'll log it as the initial description if nothing else is set
            currentFullDreamLog.initialDescription = data.description;
        } else {
            // If no prior event to attach this to, log it as a general event description (less ideal)
            // currentFullDreamLog.events.push({ choiceText: "N/A (Dream continuation)", resultingDescription: data.description });
        }
    }
    
    displayAIChoices(data.choices);

    let fragmentAwardedThisTurn = null;
    if (data.fragmentName && typeof data.fragmentName === 'string' && data.fragmentName.trim() !== "") {
        const fragmentDesc = (typeof data.fragmentDescription === 'string') ? data.fragmentDescription.trim() : "A mysterious echo from your dream.";
        awardFragment(data.fragmentName.trim(), fragmentDesc);
        fragmentAwardedThisTurn = { name: data.fragmentName.trim(), description: fragmentDesc };
    }
    // If this is a result of a choice, update the last event with fragment info
    const lastEvent = currentFullDreamLog.events[currentFullDreamLog.events.length - 1];
    if (lastEvent && lastEvent.resultingDescription === data.description) { // Check if it's the corresponding event
        lastEvent.fragmentAwarded = fragmentAwardedThisTurn;
    } else if (isInitialDreamStart && fragmentAwardedThisTurn) {
        // If fragment awarded at the very start of the dream (unlikely but possible)
        currentFullDreamLog.events.push({choiceText: "Dream's Inception", resultingDescription: data.description, fragmentAwarded: fragmentAwardedThisTurn});
    }


    if (data.imagePrompt && data.imagePrompt.trim() !== "") {
        fetchAndDisplayImage(data.imagePrompt);
    } else {
        if (dreamImageElement) dreamImageElement.style.display = 'none';
        if (dreamImageContainer) dreamImageContainer.style.display = 'none';
        if (dreamImageElement) dreamImageElement.src = '#'; 
    }

    if (data.gameOver) {
        currentFullDreamLog.finalOutcomeDescription = data.description; // Log game over description
        handleAIGameOver(data.description); 
    } else {
        if (returnToWakingBtn) returnToWakingBtn.style.display = 'none';
    }
}

function displayAIChoices(choices) { /* ... (no change) ... */ 
    if (!dreamChoicesDiv) return;
    dreamChoicesDiv.innerHTML = ''; 

    if (!choices || choices.length === 0) {
        if (returnToWakingBtn && (!returnToWakingBtn.style.display || returnToWakingBtn.style.display === 'none')) {
        }
        if (returnToWakingBtn) returnToWakingBtn.style.display = 'block';
        return;
    }

    choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => handleAIChoice(choice.action, choice.text)); // Pass choice.text
        dreamChoicesDiv.appendChild(button);
    });
}

// Modified for Task 7.2
async function handleAIChoice(action, choiceText = "Unknown choice") { // Added choiceText
    console.log("Player chose action:", action, "(Choice text:", choiceText, ")");
    if (!currentSessionId) {
        console.error("No session ID available to handle AI choice.");
        dreamNarrativeDiv.textContent = "Session error. Please restart the dream.";
        if (returnToWakingBtn) returnToWakingBtn.style.display = 'block';
        return;
    }
    
    // Log the choice made
    currentFullDreamLog.events.push({ choiceText: choiceText, resultingDescription: "Waiting for outcome...", fragmentAwarded: null });

    if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = `You chose: "${choiceText}". The dream shifts...`;
    if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = ''; 
    if (dreamImageElement) dreamImageElement.style.display = 'none'; 
    if (dreamImageContainer) dreamImageContainer.style.display = 'none';
    if (dreamImageElement) dreamImageElement.src = '#'; 

    await fetchAIData({ command: action, theme: currentTheme }); 
}

// Modified for Task 7.2
function handleAIGameOver(finalDescription) {
    currentFullDreamLog.finalOutcomeDescription = finalDescription || "The dream faded to an end.";
    if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = currentFullDreamLog.finalOutcomeDescription;
    if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = ''; 
    if (returnToWakingBtn) returnToWakingBtn.style.display = 'block'; 
    console.log("AI Dream: Game Over.");
}

// New function for Task 7.2
function generateAndDownloadMarkdown(dreamLog) {
    if (!dreamLog) {
        console.warn("No dream details to generate Markdown.");
        return;
    }

    let markdownString = `# Dream Journal Entry\n\n`;
    markdownString += `**Date:** ${new Date(dreamLog.timestamp || Date.now()).toLocaleString()}\n\n`;
    markdownString += `## Dream Narrative\n\n`;
    markdownString += `**Initial Scene:**\n${dreamLog.initialDescription || "The dream began mysteriously..."}\n\n`;

    if (dreamLog.events && dreamLog.events.length > 0) {
        markdownString += `**Events:**\n`;
        dreamLog.events.forEach((event, index) => {
            markdownString += `${index + 1}. **You chose:** ${event.choiceText || "Continue..."}\n`;
            markdownString += `   **Outcome:** ${event.resultingDescription || "The dream continued..."}\n`;
            if (event.fragmentAwarded) {
                markdownString += `   **Fragment Acquired:** ${event.fragmentAwarded.name} - *${event.fragmentAwarded.description}*\n`;
            }
            markdownString += `\n`;
        });
    }
    
    markdownString += `**Final Outcome:**\n${dreamLog.finalOutcomeDescription || "The dream concluded without a specific final narration."}\n`;

    // Check if any fragment was awarded during the last scene if not captured in events (e.g. game over on initial load)
    const lastEventFragment = dreamLog.events.length > 0 ? dreamLog.events[dreamLog.events.length -1].fragmentAwarded : null;
    if (dreamLog.fragmentAwarded && (!lastEventFragment || lastEventFragment.name !== dreamLog.fragmentAwarded.name)) {
        // This logic might be redundant if fragments are only logged within events
        // but kept for safety if fragmentAwarded was set on the log root for the last scene.
        // However, current logic puts fragments inside events.
    }


    const blob = new Blob([markdownString], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = `dream-log-${new Date(dreamLog.timestamp || Date.now()).toISOString().slice(0, 10)}-${Date.now()}.md`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log("Markdown dream log generated and download triggered:", filename);
}
