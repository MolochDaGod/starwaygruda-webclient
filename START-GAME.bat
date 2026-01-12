@echo off
echo Starting StarWayGRUDA Web Client...
echo.
echo Network: StarWayWeb (Radmin VPN)
echo Local: http://localhost:8080
echo Radmin IPv4: http://26.216.42.47:8080
echo Radmin IPv6: http://[fdfd::1ad8:2a2f]:8080
echo.

set PATH=C:\Users\david\Desktop\node-v20.11.0-win-x64;%PATH%

cd /d C:\Users\david\Desktop\StarWayGRUDA-WebClient

npm run dev
