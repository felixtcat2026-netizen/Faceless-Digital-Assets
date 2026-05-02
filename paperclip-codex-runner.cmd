@echo off
setlocal
set "CODEX_EXE=C:\Users\Damian\.vscode\extensions\openai.chatgpt-26.406.31014-win32-x64\bin\windows-x86_64\codex.exe"

if not exist "%CODEX_EXE%" (
  echo Codex executable not found: %CODEX_EXE% 1>&2
  exit /b 1
)

"%CODEX_EXE%" %*
exit /b %ERRORLEVEL%
