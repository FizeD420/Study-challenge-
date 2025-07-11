#!/bin/bash

echo "🚀 Setting up Study Challenge Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB and try again."
    exit 1
fi

echo "✅ Node.js and MongoDB found"

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p packages/backend/uploads

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend
npm install
cd ../..

# Copy environment file
echo "⚙️ Setting up environment file..."
cd packages/backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Please edit packages/backend/.env with your configuration"
else
    echo "✅ Environment file already exists"
fi
cd ../..

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOL
# Dependencies
node_modules/
packages/*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Build outputs
dist/
build/
packages/*/dist/
packages/*/build/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# Uploads
packages/backend/uploads/*
!packages/backend/uploads/.gitkeep

# Database
*.db
*.sqlite

# Temporary files
tmp/
temp/
EOL
fi

# Create uploads .gitkeep
touch packages/backend/uploads/.gitkeep

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running: mongod"
echo "2. Edit packages/backend/.env with your configuration"
echo "3. Start the development server: npm run start:backend"
echo ""
echo "📚 For more information, see the README.md file"
echo ""
echo "🔗 API will be available at: http://localhost:5000/api"
echo "📊 Health check: http://localhost:5000/api/health"