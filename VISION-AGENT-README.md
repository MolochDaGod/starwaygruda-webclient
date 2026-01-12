# 🤖 StarWayGRUDA Vision Agent

## What This Is

An AI agent powered by Google Gemini that can **see your game screen** and help you play in real-time!

The agent:
- 📸 Captures screenshots of your game
- 👁️ Analyzes what's happening using AI vision
- 💬 Answers questions about the game
- 🎮 Suggests what to do next
- 🗺️ Helps you navigate and explore

---

## Setup (2 Steps)

### Step 1: Get Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Set API Key

```powershell
# Set for current session
$env:GEMINI_API_KEY="your-api-key-here"

# Or set permanently:
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-api-key-here', 'User')
```

---

## Usage

### Interactive Mode (Chat with Agent)

```powershell
npm run agent
```

**Commands:**
- `look` or `scan` - Agent analyzes current screen
- `where am i` - Tells you your location
- `what should i do` - Suggests next actions
- Ask anything: "What's that building?" "How do I get to the cantina?"
- `exit` - Close agent

### Watch Mode (Continuous Monitoring)

```powershell
npm run agent:watch
```

Agent will automatically scan your game every 10 seconds and provide updates.

---

## Example Session

```
🎮 StarWayGRUDA Vision Agent
================================
I can see your game screen and help you play!

You: look
📸 Capturing game screen...
✓ Screenshot captured

🤖 Agent: I can see you're in a desert environment on Tatooine. 
Your HUD shows:
- Position: -1290, -3590
- FPS: 60
- Planet: Tatooine

You appear to be near Bestine spaceport. I can see some buildings 
in the distance and sandy terrain. There's an X-wing visible nearby!

You: where should I go?
📸 Capturing game screen...
✓ Screenshot captured

🤖 Agent: Based on your location near Bestine, here are some suggestions:

1. **Cantina** - Head northeast to find the cantina where you can 
   meet NPCs and get quests
2. **Spaceport** - The landing area where you can find transportation
3. **Merchant District** - Look for shops to buy equipment

I'd recommend checking out the cantina first - it's a good starting 
point for new players!

You: exit
👋 Goodbye! May the Force be with you!
```

---

## How It Works

1. **Screen Capture:**
   - Uses PowerShell to capture your game window
   - Saves screenshot to `game-screenshot.png`

2. **AI Vision Analysis:**
   - Sends screenshot to Google Gemini Vision AI
   - Gemini analyzes game state, HUD, environment
   - Returns detailed description and suggestions

3. **Context Awareness:**
   - Remembers game context (planet, position)
   - Understands Star Wars Galaxies gameplay
   - Provides relevant advice

---

## Features

### What the Agent Can See:
- ✅ 3D game world and terrain
- ✅ HUD elements (FPS, position, planet)
- ✅ Buildings and structures
- ✅ NPCs and creatures
- ✅ Your character's location
- ✅ Points of interest

### What the Agent Can Do:
- 💬 Answer questions about what you see
- 🗺️ Help you navigate to locations
- 🎯 Suggest quests and activities
- 📚 Explain game mechanics
- 🔍 Identify buildings and NPCs
- ⚡ Provide real-time guidance

---

## Tips

### Best Practices:
1. **Keep game visible** - Agent captures entire screen
2. **Use full screen** - Better for agent to see details
3. **Ask specific questions** - "What's that building?" vs "help"
4. **Use watch mode** - For hands-free guidance while exploring

### Example Questions:
- "What planet am I on?"
- "Where is the nearest cantina?"
- "What should I do as a new player?"
- "How do I get to that building?"
- "What's my current position?"
- "Are there any NPCs nearby?"

---

## Troubleshooting

### API Key Error
```
❌ Error: GEMINI_API_KEY not set!
```
**Fix:** Set the environment variable as shown in Setup Step 2

### Screenshot Fails
```
Error capturing screen
```
**Fix:** Make sure game window is visible and not minimized

### Agent Gives Generic Responses
**Fix:** 
- Make sure game is visible on screen
- Try maximizing the game window
- Use more specific questions

---

## Advanced Usage

### Custom Screenshot Path
Edit `game-vision-agent.js`:
```javascript
const SCREENSHOT_PATH = './my-screenshots/game.png';
```

### Change Analysis Frequency
For watch mode, edit `game-vision-agent.js`:
```javascript
// Line 171 - Change 10000 (10 seconds) to desired interval
this.monitorInterval = setInterval(monitor, 5000); // 5 seconds
```

### Use Different Gemini Model
Edit `game-vision-agent.js`:
```javascript
this.model = this.genAI.getGenerativeModel({ 
    model: "gemini-pro-vision" // or other model
});
```

---

## Integration with Game

The agent can be extended to:
- 📊 Read game state directly from client
- 🎮 Control character movement
- 🗣️ Voice command support
- 📝 Log gameplay sessions
- 🎯 Auto-complete quests

---

## Privacy Note

- Screenshots are only used for AI analysis
- No data is stored permanently (unless you keep `game-screenshot.png`)
- API calls go to Google's Gemini service
- No gameplay data is shared outside your system

---

## Commands Quick Reference

```powershell
# Start agent (interactive)
npm run agent

# Start agent (watch mode)
npm run agent:watch

# Or use directly:
node game-vision-agent.js        # Interactive
node game-vision-agent.js watch  # Watch mode
```

---

## Example Use Cases

### Exploration Assistant
```
You: "I'm lost, where am I?"
Agent: *analyzes screen* "You're in the Dune Sea region of Tatooine..."
```

### Quest Helper
```
You: "What should I do next?"
Agent: "I see you're at the spaceport. Consider visiting the cantina..."
```

### Building Identifier
```
You: "What's that tall building?"
Agent: "That appears to be the Bestine starport control tower..."
```

### Navigation Guide
```
You: "How do I get to the cantina?"
Agent: "From your current position, head northeast for about 500 meters..."
```

---

**Ready to play with AI assistance!** 🚀

Start the agent: `npm run agent`
