set -e
npm run build
scp -r out/* pi@192.168.0.40:/var/www/html
