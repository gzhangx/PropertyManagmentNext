call npm run build
call npm run export
call scp -r out\* pi@192.168.0.40:/var/www/html