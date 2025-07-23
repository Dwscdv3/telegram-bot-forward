# Telegram Bot - Auto Forwarding and Reaction Forwarding

This bot has two features:

- Auto forwarding all messages from a chat to other chats
  - Configured by config.yaml (no hot reloading support)
- Manual forwarding by giving certain reaction on messages
  - Configured by commands

## Installation

```bash
git clone https://github.com/Dwscdv3/telegram-bot-forward.git
cd telegram-bot-forward
cp config-template.yaml config.yaml
vim config.yaml
npm install
npm start
```
