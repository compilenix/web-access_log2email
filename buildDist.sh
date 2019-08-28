#!/bin/zsh
. ./build.sh "$1"

nodePath=$(dirname $(which node))

mkdir -pv dist
cp -v *.js *.service README.md LICENSE dist/
rm -v dist/MessageTemplateExpressions.js
cp -r "${nodePath}/.." ./node
zip -r dist/node_modules.zip node_modules
zip -r dist/node.zip ./node
rm -r ./node

set +x
