// Main JavaScript logic for the Somnium Weavers frontend
// This file will handle game state, player interactions,
// and communication with the backend.

// Character Stub
const characterName = "Dreamer One";

function displayCharacterInfo() {
    const characterInfoDiv = document.getElementById('character-info');
    if (characterInfoDiv) {
        characterInfoDiv.textContent = `Character: ${characterName}`;
    }
}

// Fragment Inventory (Placeholder)
let dreamFragments = []; // Ensure this is 'let'

function displayFragments() {
    const fragmentInventoryDiv = document.getElementById('fragment-inventory');
    if (fragmentInventoryDiv) {
        fragmentInventoryDiv.innerHTML = ''; // Clear current content
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

// DOM Elements for Dream Scene
let dreamNarrativeDiv;
let dreamChoicesDiv;
let wakingWorldHub;
let dreamScene;

// Load Dream Scenario Function
function loadDreamScenario(scenario) {
    if (!dreamNarrativeDiv || !dreamChoicesDiv || !scenario) {
        console.error("Dream elements or scenario not found!");
        return;
    }

    // CONCEPTUAL LLM CALL for dream intro:
    // async function fetchDreamIntro() {
    //     const response = await fetch('/api/generate-text', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ prompt: "Generate a 50-word atmospheric description for a dream set in a 'misty forest' with a 'faint light' and a 'dark path'." })
    //     });
    //     const data = await response.json();
    //     document.getElementById('dream-narrative').textContent = data.generatedText;
    // }
    // // Call fetchDreamIntro() here if LLM integration was live.
    // // For now, using hardcoded text:
    dreamNarrativeDiv.textContent = scenario.initialText;
    dreamChoicesDiv.innerHTML = ''; // Clear previous choices

    scenario.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => handleDreamOutcome(choice.outcome));
        dreamChoicesDiv.appendChild(button);
    });
}

// Handle Dream Outcome Function
function handleDreamOutcome(outcome) {
    if (!dreamNarrativeDiv || !wakingWorldHub || !dreamScene) {
        console.error("Required elements not found for handling outcome!");
        return;
    }
    // Display outcome text (e.g., in dream-narrative or an alert)
    // For now, let's update the narrative div and then transition.
    // A more sophisticated UI might have a dedicated space for outcome text before transitioning.
    dreamNarrativeDiv.textContent = outcome.text; // Show outcome text briefly

    if (outcome.fragment) {
        // CONCEPTUAL LLM CALL for fragment description:
        // async function fetchFragmentDescription(fragmentName) {
        //     const response = await fetch('/api/generate-text', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ prompt: `Write a 20-word mysterious and hopeful description for a dream fragment called '${fragmentName}'.` })
        //     });
        //     const data = await response.json();
        //     return data.generatedText;
        // }
        // // If LLM integration was live:
        // // const dynamicDescription = await fetchFragmentDescription(outcome.fragment.name);
        // // awardedFragment.description = dynamicDescription;
        // // For now, using hardcoded description:
        dreamFragments.push({ name: outcome.fragment.name, description: outcome.fragment.description });
        displayFragments(); // Update inventory in Waking World
        localStorage.setItem('dreamFragments', JSON.stringify(dreamFragments)); // Save fragments
    }

    // Add a slight delay before transitioning back to see the outcome text
    setTimeout(() => {
        if (dreamScene) dreamScene.style.display = 'none';
        if (wakingWorldHub) wakingWorldHub.style.display = 'block';
        // Reset dream narrative for the next dream, or it will show the last outcome
        if (dreamNarrativeDiv) dreamNarrativeDiv.textContent = '';
        if (dreamChoicesDiv) dreamChoicesDiv.innerHTML = '';
    }, 2500); // 2.5 second delay
}


// Event Listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    wakingWorldHub = document.getElementById('waking-world-hub');
    dreamScene = document.getElementById('dream-scene');
    const enterDreamBtn = document.getElementById('enter-dream-btn');
    dreamNarrativeDiv = document.getElementById('dream-narrative');
    dreamChoicesDiv = document.getElementById('dream-choices');

    // Load saved fragments
    const savedFragments = localStorage.getItem('dreamFragments');
    if (savedFragments) {
        dreamFragments = JSON.parse(savedFragments);
    }

    if (enterDreamBtn) {
        enterDreamBtn.addEventListener('click', () => {
            if (wakingWorldHub) wakingWorldHub.style.display = 'none';
            if (dreamScene) dreamScene.style.display = 'block';
            
            // Load the Whispering Forest scenario
            // Ensure 'scenarios' object is available (loaded from dream_scenarios.js)
            if (typeof scenarios !== 'undefined' && scenarios.whisperingForest) {
                loadDreamScenario(scenarios.whisperingForest);
            } else {
                console.error("Scenarios or Whispering Forest scenario not found!");
                // Fallback: display an error or a default message in dream scene
                if(dreamNarrativeDiv) dreamNarrativeDiv.textContent = "Error: Dream scenario could not be loaded.";
            }
            console.log("Enter Dream button clicked. Transitioning to dream scene.");
        });
    }

    // Initial display updates
    displayCharacterInfo();
    displayFragments();
});
