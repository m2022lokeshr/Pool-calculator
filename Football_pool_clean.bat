@echo off
cd /d "C:\Users\m_202\Repo\Pool-calculator"
set PORT=3000
set BASE_PATH=/
pnpm --filter @workspace/football-pool run dev
pause
