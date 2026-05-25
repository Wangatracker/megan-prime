#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           MEGAN-PRIME INSTALLATION                        ║"
echo "║           Created by TrackerWanga                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18+. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    echo "SESSION=Megan~" > .env
    echo "BOT_NAME=Megan-Prime" >> .env
    echo "OWNER_NAME=TrackerWanga" >> .env
    echo "OWNER_NUMBER=254119387715" >> .env
    echo "PREFIX=." >> .env
    echo "MODE=public" >> .env
    echo "TIMEZONE=Africa/Nairobi" >> .env
    echo "✅ .env created - Please edit with your settings"
else
    echo "✅ .env exists"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           INSTALLATION COMPLETE                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your session string"
echo "2. Run: npm start"
echo ""
echo "Channel: https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37"
echo ""
