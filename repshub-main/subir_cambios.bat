@echo off
echo ==========================================
echo    DETECTANDO CAMBIOS Y SUBIENDO
echo ==========================================
echo.

:: 1. Prepara todos los archivos
git add .

:: 2. Guarda los cambios con la fecha y hora actual automaticamente
git commit -m "Actualizacion automatica: %date% %time%"

:: 3. Envia a GitHub
echo.
echo Subiendo cambios a GitHub...
git push

:: 4. Despliega en Cloudflare Workers
echo.
echo Desplegando en Cloudflare Workers...
call npx wrangler deploy

echo.
echo ==========================================
echo   LISTO! GitHub + Cloudflare actualizados
echo ==========================================
echo.
pause