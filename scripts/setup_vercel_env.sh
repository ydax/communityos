#!/bin/bash
# setup_vercel_env.sh
# Automates adding Vercel credentials locally and to Vercel preview/production.

echo "========================================="
echo "  Vercel Domain Provisioning Setup     "
echo "========================================="
echo ""
echo "1. Create a Vercel Access Token at: https://vercel.com/account/tokens"
echo "2. Find your Vercel Project ID at: https://vercel.com/[org]/[project]/settings"
echo ""

read -p "Enter your VERCEL_API_TOKEN: " api_token
read -p "Enter your VERCEL_PROJECT_ID (e.g. Qm...): " project_id

if [ -z "$api_token" ] || [ -z "$project_id" ]; then
    echo "Error: Both VERCEL_API_TOKEN and VERCEL_PROJECT_ID are required."
    exit 1
fi

echo ""
echo "Adding variables to .env.local..."

# Check if .env.local exists, create if not
if [ ! -f .env.local ]; then
    touch .env.local
fi

# Remove existing variables if any to prevent duplicates
sed -i.bak '/^VERCEL_API_TOKEN=/d' .env.local
sed -i.bak '/^VERCEL_PROJECT_ID=/d' .env.local
rm -f .env.local.bak

# Append variables
echo "VERCEL_API_TOKEN=\"$api_token\"" >> .env.local
echo "VERCEL_PROJECT_ID=\"$project_id\"" >> .env.local
echo "✅ Added to .env.local"

# Adding variables directly to the Vercel project's environment via CLI
echo ""
echo "Syncing with Vercel (Requires Vercel CLI login)..."
echo "Note: The scripts will execute \`vercel env add\`. If you are prompted for environment targets, select [Preview, Production, Development]."

echo "\"$api_token\"" | npx vercel env add VERCEL_API_TOKEN preview production development --project $project_id
echo "\"$project_id\"" | npx vercel env add VERCEL_PROJECT_ID preview production development --project $project_id

echo ""
echo "✅ Success! Vercel API access has been secured."
echo "You can now run \`npm run dev\` and use \`node scripts/test_domains_api.js\` to test syncing."
