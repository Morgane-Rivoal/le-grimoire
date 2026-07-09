@echo off
cd /d "%~dp0"

set "NODE_EXE="
where node >nul 2>nul && set "NODE_EXE=node"

if not defined NODE_EXE (
  set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if exist "%CODEX_NODE%" set "NODE_EXE=%CODEX_NODE%"
)

if not defined NODE_EXE (
  echo Node.js est necessaire pour lancer Le Grimoire.
  echo Installez Node.js depuis https://nodejs.org/
  pause
  exit /b 1
)

echo.
echo Le Grimoire demarre sur http://127.0.0.1:3000
echo Depuis un telephone sur le meme Wi-Fi, utilise l'adresse IP locale du PC.
echo Gardez cette fenetre ouverte pendant l'utilisation.
echo.
"%NODE_EXE%" server.js
