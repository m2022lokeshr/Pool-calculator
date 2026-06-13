@echo off
cd /d "C:\Users\m_202\Repo\Pool-calculator"
set PORT=3000
set BASE_PATH=/
echo Starting Pool Calculator in a new window...
start "Pool Calculator Server" cmd /k "pnpm --filter @workspace/football-pool run dev"
timeout /t 5 /nobreak
start http://localhost:3000
echo.
echo The app is now running. Close the server window when done.
