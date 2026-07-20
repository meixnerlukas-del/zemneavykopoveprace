@echo off
chcp 65001 >nul
echo ================================================
echo   Nahravam kod na GitHub...
echo   Ak vyskoci okno "Sign in with your browser",
echo   klikni a v GitHube potvrd "Authorize".
echo ================================================
echo.
cd /d "C:\Users\meixn\Desktop\claude code\bloky\zemneavykopoveprace.sk"
git remote remove origin >nul 2>&1
git remote add origin https://github.com/meixnerlukas-del/zemneavykopoveprace.git
git branch -M main
git push -u origin main
echo.
if %errorlevel%==0 (
  echo ================================================
  echo   HOTOVO! Kod je na GitHube. Mozes zavriet okno
  echo   a napisat Claudovi "nahrate".
  echo ================================================
) else (
  echo ================================================
  echo   Nieco sa nepodarilo. Odfot obrazovku Claudovi.
  echo ================================================
)
echo.
pause
