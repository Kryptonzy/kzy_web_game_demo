// This file will store data for various dream scenarios,
// such as descriptions, choices, and outcomes.

const scenarios = {
    "whisperingForest": {
        // LLM_CALL_CONCEPT: To generate 'initialText', we would send a prompt like: "Generate a 50-word atmospheric description for a dream set in a 'misty forest' with a 'faint light' and a 'dark path'."
        // The LLM's response would then populate 'initialText'.
        initialText: "You find yourself in a misty forest. A faint light glows ahead. A narrow, dark path veers to your left.",
        choices: [
            {
                text: "Approach the light.",
                outcome: {
                    text: "The light is a Wisp. It offers you a 'Glimmering Mote' before vanishing.",
                    fragment: {
                        name: "Glimmering Mote",
                        // LLM_CALL_CONCEPT: To generate 'description' for 'Glimmering Mote', we would send a prompt like: "Write a 20-word mysterious and hopeful description for a dream fragment called 'Glimmering Mote'."
                        // The LLM's response would then populate 'description'.
                        description: "A tiny spark of solidified hope."
                    }
                }
            },
            {
                text: "Take the dark path.",
                outcome: {
                    text: "The path leads to an old, locked chest. You feel a sense of foreboding, but the chest remains sealed for now.",
                    fragment: null // Or omit fragment property
                }
            }
        ]
    }
};
