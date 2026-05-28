// server.js — Stack Tower 3D
// Автоматически ставит зависимости при первом запуске

// ════════ АВТО-УСТАНОВКА ЗАВИСИМОСТЕЙ ════════
const fs = require('fs');
const { execSync } = require('child_process');

const requiredDeps = ['express', 'telegraf'];
let needInstall = false;
for (const dep of requiredDeps) {
  try {
    require.resolve(dep);
  } catch (e) {
    needInstall = true;
    console.log(`📦 Модуль "${dep}" не найден — поставлю`);
    break;
  }
}

if (needInstall) {
  console.log('📦 Устанавливаю зависимости (npm install)... это займёт ~30 секунд');
  try {
    execSync('npm install --no-audit --no-fund', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Зависимости установлены, продолжаю запуск');
  } catch (err) {
    console.error('❌ npm install упал:', err.message);
    console.error('Попробуй вручную в терминале: npm install');
    process.exit(1);
  }
}

// ════════ ОСНОВНОЙ КОД ════════
const express = require('express');
const path = require('path');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// Веб-сервер
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Telegram-бот
if (!BOT_TOKEN) {
  console.warn('⚠️ BOT_TOKEN не задан — бот не запустится. Задай переменную в BotHost.');
} else if (!WEBAPP_URL) {
  console.warn('⚠️ WEBAPP_URL не задан — кнопка не появится. Задай переменную (URL твоего BotHost-приложения).');
} else {
  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    try {
      await ctx.reply(
        '🎮 *Stack Tower 3D*\n\nСтек цветных блоков. Тапни в нужный момент, чтобы блок упал точно на башню.\n\nИдеальное попадание — больше очков!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: WEBAPP_URL } }]]
          }
        }
      );
    } catch (err) { console.error('start error:', err.message); }
  });

  bot.help(ctx => ctx.reply('Нажми /start чтобы открыть игру 🎮'));

  bot.on('text', async (ctx) => {
    try {
      await ctx.reply('🎮 Открыть игру:', {
        reply_markup: {
          inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: WEBAPP_URL } }]]
        }
      });
    } catch (err) { console.error('text error:', err.message); }
  });

  bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: 'Играть',
      web_app: { url: WEBAPP_URL }
    }
  }).then(() => console.log('✅ Menu Button установлен'))
    .catch(err => console.error('Menu Button error:', err.message));

  bot.catch(err => console.error('Bot error:', err));

  bot.launch()
    .then(() => {
      console.log('🤖 Telegram bot launched');
      console.log(`🌐 WebApp URL: ${WEBAPP_URL}`);
    })
    .catch(err => console.error('❌ Bot launch failed:', err.message));

  process.on('SIGINT', () => { bot.stop('SIGINT'); process.exit(); });
  process.on('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(); });
}
