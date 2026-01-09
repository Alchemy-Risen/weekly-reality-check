#!/bin/bash

# Test cron endpoints locally
# Run this with: bash test-cron.sh

CRON_SECRET="9mEBloM5bGZ/LLQItsMkbnkIbnjdJTV5qRyZ7605eqg="

echo "🧪 Testing Cron Endpoints"
echo "========================="
echo ""

echo "1. Testing Weekly Check-ins Endpoint..."
echo "   URL: http://localhost:3000/api/cron/send-weekly-checkins"
echo ""

curl -X GET http://localhost:3000/api/cron/send-weekly-checkins \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""
echo "2. Testing Monday Follow-ups Endpoint..."
echo "   URL: http://localhost:3000/api/cron/send-monday-followups"
echo ""

curl -X GET http://localhost:3000/api/cron/send-monday-followups \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""
echo "✅ Cron endpoint tests complete!"
echo ""
echo "Note: These endpoints will actually send emails to all users."
echo "Make sure you're ready for that before running in production!"
