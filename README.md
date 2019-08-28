# Donate if you want
https://www.paypal.me/compilenix

# Requirements
- bash
- git
- zip
- unzip

# Installation
```sh
git clone https://git.compilenix.org/Compilenix/web-access_log2email.git
cd web-access_log2email
./buildDist.sh --production
cd dist
cp config.example.js config.js
$EDITOR config.js # make your changes
unzip -ou node.zip >/dev/null
unzip -ou node_modules.zip >/dev/null
rm -v node.zip node_modules.zip
./node/bin/node index.js
```

# Development
```sh
git clone https://git.compilenix.org/Compilenix/web-access_log2email.git
cd web-access_log2email
. ./build.sh
cp config.example.js config.js
$EDITOR config.js # make your changes
node index.js
```
