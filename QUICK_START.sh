#!/bin/bash

echo "🎧 TrackPrep — Quick Start Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v)"
echo ""

# Setup Backend
echo -e "${BLUE}[1/4] Setting up Backend...${NC}"
cd backend || exit
cp .env.example .env
pnpm install --frozen-lockfile
echo -e "${GREEN}✅ Backend ready${NC}"
echo ""

# Setup Frontend
echo -e "${BLUE}[2/4] Setting up Frontend...${NC}"
cd ../my-app || exit
pnpm install --frozen-lockfile
echo -e "${GREEN}✅ Frontend ready${NC}"
echo ""

# Build check
echo -e "${BLUE}[3/4] Building TypeScript...${NC}"
cd ../backend && pnpm build > /dev/null 2>&1
echo -e "${GREEN}✅ Backend compiled${NC}"
cd ../my-app && pnpm build > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend compiled${NC}"
echo ""

echo -e "${BLUE}[4/4] Ready to start!${NC}"
echo ""
echo "🚀 To start development:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  $ cd backend && pnpm dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  $ cd my-app && pnpm dev"
echo ""
echo "Then open: http://localhost:5174"
echo ""
echo "📚 Documentation:"
echo "  - README.md — Overview"
echo "  - IMPLEMENTATION_SUMMARY.md — Features detail"
echo "  - FEATURES_CHECKLIST.md — Complete checklist"
echo "  - backend/README.md — API reference"
echo ""
