call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
rem call npm run export
call scp -r out\* pi@192.168.0.40:/var/www/html