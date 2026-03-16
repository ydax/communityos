#!/bin/bash
# setup_porkbun_env.sh
# Automates adding Porkbun API credentials locally and to Vercel

echo "========================================="
echo "  Porkbun API Credential Setup           "
echo "========================================="
echo ""
echo "1. Go to https://porkbun.com/account/api"
echo "2. Create a new API Key if you haven't already"
echo ""

read -p "Enter your PORKBUN_API_KEY: " api_key
read -p "Enter your PORKBUN_SECRET_KEY: " secret_key

if [ -z "\$api_key" ] || [ -z "\$secret_key" ]; then
    echo "Error: Both PORKBUN_API_KEY and PORKBUN_SECRET_KEY are required."
    exit 1
fi

echo ""
echo "Adding variables to .env.local..."

# Check if .env.local exists, create if not
if [ ! -f .env.local ]; then
    touch .env.local
fi

# Remove existing variables if any to prevent duplicates
sed -i.bak '/^PORKBUN_API_KEY=/d' .env.local
sed -i.bak '/^PORKBUN_SECRET_KEY=/d' .env.local
rm -f .env.local.bak

# Append variables
echo "PORKBUN_API_KEY=\"\$api_key\"" >> .env.local
echo "PORKBUN_SECRET_KEY=\"\$secret_key\"" >> .env.local
echo "✅ Added to .env.local"

# Automatically push to Vercel
echo ""
echo "Syncing with Vercel..."
echo "\"\$api_key\"" | npx vercel env add PORKBUN_API_KEY preview production development --project centraltexas
echo "\"\$secret_key\"" | npx vercel env add PORKBUN_SECRET_KEY preview production development --project centraltexas

echo ""
echo "✅ Success! Porkbun API access has been secured."
