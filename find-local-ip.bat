@echo off
echo 🔍 Finding your local IP address...
echo.

echo 🪟 Windows detected:
echo Running ipconfig...
echo.
ipconfig | findstr "IPv4"
echo.
echo 📝 Look for the IPv4 Address above and update your .env file with:
echo    EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
echo.
echo 🚀 Then restart your Expo app with: npx expo start --clear
pause
