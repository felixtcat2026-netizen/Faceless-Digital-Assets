@echo off
setlocal

set "HERMES_PYTHON=C:\Users\Damian\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"

if not exist "%HERMES_PYTHON%" (
  echo Hermes Python not found at "%HERMES_PYTHON%".
  exit /b 1
)

"%HERMES_PYTHON%" %*
