@echo off
echo "Iniciando Chrome sin CORS para desarrollo..."
echo "IMPORTANTE: Solo usar para desarrollo, no para navegación normal"
echo.

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\temp\chrome_dev_session" --disable-web-security --disable-features=VizDisplayCompositor --allow-running-insecure-content --disable-background-timer-throttling

echo "Chrome iniciado sin CORS. Puedes usar http://localhost:4200"
echo "Para cerrar esta sesión especial, cierra todas las ventanas de Chrome"
pause
