#!/bin/zsh
set -x
set +e
rm -rf node_modules .fnm dist
set -e

curl -fsSL https://github.com/Schniz/fnm/raw/master/.ci/install.sh | bash -s -- --install-dir "./.fnm" --skip-shell
PATH="$(pwd)/.fnm:$PATH"
eval "`fnm env --multi`"

fnm install
fnm use

case "$1" in
    "--production"|"--release")
        npm ci --production
    ;;
    "--development"|"--debug"|*)
        npm ci
    ;;
esac

npm run-script test
set +x
