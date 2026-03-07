#!/bin/bash

echo "🏥 Testing Health Endpoints..."
echo ""

# Basic health check
echo "1️⃣ Basic Health Check:"
curl -s http://localhost:3000/api/health | jq '.'
echo ""
echo ""

# Detailed health check
echo "2️⃣ Detailed Health Check:"
curl -s http://localhost:3000/api/health/detailed | jq '.'
echo ""
