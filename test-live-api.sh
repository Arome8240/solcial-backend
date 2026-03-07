#!/bin/bash

# Test script for live API endpoints
API_URL="https://solcial-backend.onrender.com/api"

echo "🔍 Testing Solcial Backend API"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint..."
HEALTH=$(curl -s "$API_URL/health")
echo "Response: $HEALTH"
echo ""

# Test 2: Signup
echo "2️⃣ Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "username": "testuser"
  }')
echo "Response: $SIGNUP_RESPONSE"
echo ""

# Test 3: Resend Code
echo "3️⃣ Testing Resend Verification Code..."
RESEND_RESPONSE=$(curl -s -X POST "$API_URL/auth/resend-code" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }')
echo "Response: $RESEND_RESPONSE"
echo ""

echo "✅ Test completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Check your backend logs for the verification code"
echo "   2. Use the code to verify the email"
echo "   3. Test signin with the verified account"
