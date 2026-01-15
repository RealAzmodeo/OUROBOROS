@echo off
:: Asegurar que el script se ejecuta en la carpeta donde esta guardado
cd /d "%~dp0"

TITLE Neon Ouroboros Launcher
echo ==========================================
echo    NEON OUROBOROS - CYBERPUNK SNAKE
echo ==========================================
echo.

echo [1/3] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No se encuentra 'node'. 
    echo Por favor, instala Node.js desde https://nodejs.org/
    echo Si ya lo instalaste, reinicia tu PC o revisa el PATH.
    pause
    exit /b
)

echo [2/3] Verificando dependencias (node_modules)...
if not exist "node_modules\" (
    echo No se encontro la carpeta node_modules. Instalando...
    call npm install
)

echo.
echo [3/3] Iniciando el juego...
echo Se abrira http://localhost:5173 en tu navegador.
echo Mantén esta ventana abierta para jugar.
echo.

:: Abrir navegador despues de un par de segundos para dar tiempo al servidor
start "" "http://localhost:5173"

:: Ejecutar el servidor de desarrollo
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo El servidor ha tenido un problema. 
    echo Revisa los mensajes de arriba.
    pause
)
