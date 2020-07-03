#!/bin/bash

set -o errexit

cd /opt/holoapi || { echo "No directory found"; exit 1; }

git pull

npm install

npm run migrate

npm run generate-api

pm2 reload all
