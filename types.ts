export interface GeminiApiChoice {
    text: string;
    action: string;
}

export interface GeminiApiResponse {
    description: string;
    choices: GeminiApiChoice[];
    imagePrompt: string;
    fragmentName?: string;
    fragmentDescription?: string;
    gameOver?: boolean;
}
