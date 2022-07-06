call npm run build
call npm run export
call scp -r out\* pi@192.168.0.41:/var/www/html