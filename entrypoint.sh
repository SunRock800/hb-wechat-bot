#!/bin/bash

# 检查容器是否已经初始化
if [ ! -f "/app/package-lock.json" ]; then
    # 执行初始化命令
    npm install
fi

echo 'wechat-bot'

#while true; do
#  sleep 60
#done

exec "$@"
