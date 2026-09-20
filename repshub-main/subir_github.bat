@echo off
color 0A
echo ========================================================
echo   RepsHub - Subida Automatica a GitHub y Vercel
echo ========================================================
echo.
echo Guardando todos los cambios locales...
git add .

echo.
echo Creando un nuevo mensaje de actualizacion...
set datetime=%date% %time%
git commit -m "Auto-update: %datetime%"

echo.
echo Subiendo los archivos a GitHub...
git push origin main

echo.
echo ========================================================
echo  EXITO: ¡Los cambios se enlazaron con GitHub y Vercel
echo  esta desplegando la nueva version en este preciso momento!
echo ========================================================
echo.
pause
