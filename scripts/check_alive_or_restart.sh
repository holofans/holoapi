#!/bin/bash

curl --connect-timeout 5 \
    --max-time 10 \
    --retry 5 \
    --retry-delay 5 \
    --retry-max-time 40 \
    'http://localhost:2434/v1/live' > /dev/null
status=$?

[ $status -eq 0 ] && echo "LGTM $(date)" || echo "SERVER HEALTH BAD $(date)"

if ! [ $status -eq 0 ]
then
  echo "RESTARTING"
  /etc/init.d/postgresql restart
fi
