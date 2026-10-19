@echo off
title Herdr Web Controller
cd /d "H:\AI Project\herdr\web-controller"
echo ====================================================
echo   HERDR WEB CONTROLLER DANG KHOI DONG...
echo ====================================================
echo.
echo Dang mo trinh duyet tai http://localhost:3840
start http://localhost:3840
echo.
node server.js
pause
