#!/bin/bash
# Rebuild native modules for current Node version
npm rebuild sqlite3 sharp 2>/dev/null
# Start the bot
node index.js
