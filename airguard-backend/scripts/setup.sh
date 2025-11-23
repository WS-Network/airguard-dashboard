#!/bin/bash

echo "🚀 Setting up Airguard Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   Required: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET"
    read -p "Press Enter after editing .env file..."
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. API will be available at: http://localhost:3001"
echo "3. Health check: http://localhost:3001/health"
echo "4. Demo credentials: demo@airguard.com / demo123"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm start           - Start production server"
echo "  npm test            - Run tests"
echo "  npm run db:studio   - Open Prisma Studio"
echo ""
echo "🐳 Docker alternative:"
echo "  docker-compose up   - Start with Docker" 