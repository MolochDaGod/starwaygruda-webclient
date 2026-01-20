#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

// Configuration
const API_KEY = process.env.GEMINI_API_TOKEN || process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const SCREENSHOT_PATH = './game-screenshot.png';

class GameVisionAgent {
    constructor() {
        this.genAI = new GoogleGenerativeAI(API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        this.chat = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.gameContext = {
            position: null,
            planet: null,
            nearbyPOIs: [],
            lastScreenshot: null
        };
    }

    async captureScreen() {
        console.log('📸 Capturing game screen...');
        
        // Use PowerShell to capture the browser window
        const psScript = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save('${SCREENSHOT_PATH}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
        `;
        
        try {
            await execAsync(`powershell -Command "${psScript.replace(/\n/g, ';')}"`);
            console.log('✓ Screenshot captured');
            return true;
        } catch (error) {
            console.error('Error capturing screen:', error);
            return false;
        }
    }

    async analyzeGameScreen(userQuestion = null) {
        // Read the screenshot
        const imageData = fs.readFileSync(SCREENSHOT_PATH);
        const base64Image = imageData.toString('base64');
        
        const systemPrompt = `You are an AI assistant helping a player in StarWayGRUDA, a Star Wars Galaxies 3D browser game.

GAME CONTEXT:
- This is a Pre-CU Star Wars Galaxies emulator
- Player is in a 3D browser-based client
- Game features: character movement (WASD), exploration, quests, crafting, combat
- Current location: ${this.gameContext.planet || 'Unknown planet'}
- Position: ${this.gameContext.position ? `${this.gameContext.position.x}, ${this.gameContext.position.z}` : 'Unknown'}

ANALYZE THE SCREENSHOT:
1. What do you see in the game world?
2. What is the player's current situation?
3. What HUD elements are visible? (FPS, position, planet name, etc.)
4. Are there any NPCs, buildings, or points of interest visible?
5. What should the player do next?

${userQuestion ? `USER QUESTION: ${userQuestion}` : 'Provide helpful guidance based on what you see.'}`;

        try {
            const result = await this.model.generateContent([
                systemPrompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: 'image/png'
                    }
                }
            ]);
            
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error analyzing screen:', error);
            return 'Sorry, I had trouble analyzing the screen. Please try again.';
        }
    }

    async startChat() {
        console.log('\n🎮 StarWayGRUDA Vision Agent');
        console.log('================================');
        console.log('I can see your game screen and help you play!');
        console.log('\nCommands:');
        console.log('  "look" or "scan" - I\'ll analyze what\'s on screen');
        console.log('  "where am i" - Tell you about your location');
        console.log('  "what should i do" - Suggest next steps');
        console.log('  "help [topic]" - Get help on specific topics');
        console.log('  "exit" - Close the agent');
        console.log('\nOr just ask me anything about what you see!\n');

        this.promptUser();
    }

    promptUser() {
        this.rl.question('You: ', async (input) => {
            const command = input.trim().toLowerCase();

            if (command === 'exit' || command === 'quit') {
                console.log('\n👋 Goodbye! May the Force be with you!');
                this.rl.close();
                return;
            }

            if (command === '' || command === 'look' || command === 'scan') {
                await this.captureScreen();
                const analysis = await this.analyzeGameScreen();
                console.log(`\n🤖 Agent: ${analysis}\n`);
                this.promptUser();
                return;
            }

            if (command === 'where am i' || command.includes('location')) {
                await this.captureScreen();
                const analysis = await this.analyzeGameScreen('Where am I currently located? Describe my surroundings and tell me the coordinates if visible.');
                console.log(`\n🤖 Agent: ${analysis}\n`);
                this.promptUser();
                return;
            }

            if (command === 'what should i do' || command.includes('next')) {
                await this.captureScreen();
                const analysis = await this.analyzeGameScreen('Based on what you see, what should I do next? Suggest some actions or places to explore.');
                console.log(`\n🤖 Agent: ${analysis}\n`);
                this.promptUser();
                return;
            }

            // General question
            await this.captureScreen();
            const analysis = await this.analyzeGameScreen(input);
            console.log(`\n🤖 Agent: ${analysis}\n`);
            this.promptUser();
        });
    }

    async watchGame() {
        console.log('\n👁️  Starting continuous game monitoring...');
        console.log('I\'ll watch your game and provide updates every 10 seconds.');
        console.log('Press Ctrl+C to stop.\n');

        const monitor = async () => {
            await this.captureScreen();
            const analysis = await this.analyzeGameScreen('Briefly describe the current game state and any notable changes or important information.');
            console.log(`[${new Date().toLocaleTimeString()}] ${analysis}\n`);
        };

        // Initial scan
        await monitor();

        // Monitor every 10 seconds
        this.monitorInterval = setInterval(monitor, 10000);
    }
}

// Main execution
const agent = new GameVisionAgent();

// Check for API key
if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Error: GEMINI_API_TOKEN or GEMINI_API_KEY not set!');
    console.log('\nTo use this agent:');
    console.log('1. Get API key from: https://aistudio.google.com/app/apikey');
    console.log('2. Set environment variable:');
    console.log('   $env:GEMINI_API_TOKEN="your-key-here"');
    console.log('   OR');
    console.log('   $env:GEMINI_API_KEY="your-key-here"');
    console.log('3. Run again: npm run agent\n');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'chat';

if (mode === 'watch') {
    agent.watchGame();
} else {
    agent.startChat();
}
