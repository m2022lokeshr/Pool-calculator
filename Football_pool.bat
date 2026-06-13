@echo off
echo Step 1: Checking current folder...
cd /d "C:\Users\m_202\Repo\Pool-calculator"
echo Current folder: %cd%
echo.

echo Step 2: Installing missing binaries...
pnpm add -D @rollup/rollup-win32-x64-msvc@4.61.1 @tailwindcss/oxide-win32-x64-msvc@4.3.1 lightningcss-win32-x64-msvc@1.32.0 -w
echo.
echo Step 3: Binaries done. Setting up environment...
set PORT=3000
set BASE_PATH=/
echo Environment set.
echo.

echo Step 4: Starting the Pool Calculator...
echo If this fails, you will see the error below.
echo.
call pnpm --filter @workspace/football-pool run dev
echo.
echo The app has stopped or failed.
echo.
pause