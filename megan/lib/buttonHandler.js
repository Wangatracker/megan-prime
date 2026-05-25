// Megan-Prime Interactive Button Handler
// Handles button responses from gifted-btns interactive messages

class ButtonHandler {
    constructor(bot) {
        this.bot = bot;
        this.handlers = new Map();
    }

    // Register a handler for a button ID prefix
    register(prefix, handler) {
        this.handlers.set(prefix, handler);
    }

    // Process incoming button response
    async handle(msg) {
        try {
            const buttonResponse = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage;
            if (!buttonResponse) return false;

            const buttonId = buttonResponse.paramsJson 
                ? JSON.parse(buttonResponse.paramsJson)?.id 
                : buttonResponse.buttonId;

            if (!buttonId) return false;

            console.log(`🔘 Button pressed: ${buttonId}`);

            // Check registered handlers
            for (const [prefix, handler] of this.handlers) {
                if (buttonId.startsWith(prefix)) {
                    const from = msg.key.remoteJid;
                    const sender = msg.key.participant || from;
                    await handler(buttonId, from, sender, msg, this.bot);
                    return true;
                }
            }

            // Default: treat as command (e.g., button sends "cmd_play song name")
            if (buttonId.startsWith('cmd_')) {
                const cmdText = buttonId.replace('cmd_', '');
                const sock = this.bot.sock;
                // Simulate a text message with the command
                const fakeMsg = { ...msg, message: { conversation: cmdText } };
                await this.bot.processMessage(fakeMsg);
                return true;
            }

            return false;
        } catch (e) {
            console.error('Button handler error:', e.message);
            return false;
        }
    }
}

module.exports = ButtonHandler;
