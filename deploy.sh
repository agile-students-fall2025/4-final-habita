#!/bin/bash

# Habita Deployment Script for Digital Ocean Droplet
# This script automates the deployment process

set -e

echo "Starting Habita deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo " Error: .env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Pull latest changes
echo " Pulling latest changes from git..."
git pull origin master

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Remove old images
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for containers to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if containers are running
if [ "$(docker ps -q -f name=habita-backend)" ] && [ "$(docker ps -q -f name=habita-frontend)" ]; then
    echo "Deployment successful!"
    echo ""
    echo "Container status:"
    docker-compose ps
    echo ""
    echo " Your application is now live!"
    echo "Frontend: http://$(curl -s ifconfig.me)"
    echo "Backend: http://$(curl -s ifconfig.me):4000"
else
    echo "Deployment failed! Check logs:"
    echo "Backend logs: docker-compose logs backend"
    echo "Frontend logs: docker-compose logs frontend"
    exit 1
fi
