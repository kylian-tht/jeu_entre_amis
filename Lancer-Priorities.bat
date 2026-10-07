@echo off
chcp 65001 > nul
title Priorities - Serveur Local
color 0b

echo ========================================================
echo        PRIORITIES - JEU D'AMBIANCE LOCAL
echo ========================================================
echo.
echo Demarrage du serveur...
echo L'ecran TV s'ouvrira automatiquement dans votre navigateur.
echo Pour arreter le serveur, fermez simplement cette fenetre.
echo ========================================================
echo.

node server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Le serveur s'est arrete avec une erreur.
    echo Verifiez que Node.js est bien installe sur cette machine.
    pause
)
