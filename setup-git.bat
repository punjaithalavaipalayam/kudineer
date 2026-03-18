@echo off
echo =============================================
echo  Kudineer - GitHub Setup Script
echo =============================================
echo.

REM Step 1: Init git
git init
git config user.email "punjaithalavaipalyam@gmail.com"
git config user.name "punjaithalavaipalayam"

REM Step 2: Stage and commit all files
git add .
git commit -m "feat: initial Kudineer v2 PWA with Vite, MLD/Litres toggle, CI/CD"

REM Step 3: Set branch to main
git branch -M main

echo.
echo =============================================
echo  DONE! Now run the following command:
echo.
echo  git remote add origin https://github.com/punjaithalavaipalayam/kudineer.git
echo  git push -u origin main
echo.
echo  (Replace 'kudineer' with your actual repo name)
echo =============================================
pause
