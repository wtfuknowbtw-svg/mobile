#!/bin/bash

echo "🔍 Finding your local IP address..."
echo ""

# Check the operating system
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected:"
    echo "Run this command in Command Prompt:"
    echo "   ipconfig"
    echo "Look for 'IPv4 Address' under your active network adapter"
    echo ""
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Mac detected:"
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    echo "Your local IP is: $IP"
    echo "Or run: ifconfig"
    echo "Look for 'inet' under 'en0' or 'en1'"
    echo ""
else
    echo "🐧 Linux detected:"
    IP=$(ip addr | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d'/' -f1)
    echo "Your local IP is: $IP"
    echo "Or run: ip addr"
    echo "Look for 'inet' under your main network interface"
    echo ""
fi

echo "📝 Update your .env file with:"
echo "   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api"
echo ""
echo "🚀 Then restart your Expo app with: npx expo start --clear"
