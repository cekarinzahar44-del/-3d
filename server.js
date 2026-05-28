// server.js — Stack Tower 3D
// Express раздаёт игру + Telegraf-бот показывает её через Menu Button

const express = require('express');
const path = require('path');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// ════════ ВЕБ-СЕРВЕР ════════
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ════════ TELEGRAM BOT ════════
if (!BOT_TOKEN) {
  console.warn('⚠️ BOT_TOKEN не задан — бот не запустится. Задай переменную в BotHost.');
} else if (!WEBAPP_URL) {
  console.warn('⚠️ WEBAPP_URL не задан — кнопка не появится. Задай переменную (URL твоего BotHost-приложения, начинается с https://).');
} else {
  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    try {
      await ctx.reply(
        '🎮 *Stack Tower 3D*\n\nСтек цветных блоков. Тапни в нужный момент, чтобы блок упал точно на башню.\n\nИдеальное попадание — больше очков!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Играть', web_app: { url: WEBAPP_URL } }]
            ]
          }
        }
      );
    } catch (err) {
      console.error('start error:', err.message);
    }
  });

  bot.help(ctx => ctx.reply('Нажми /start чтобы открыть игру 🎮'));

  bot.on('text', async (ctx) => {
    try {
      await ctx.reply('🎮 Открыть игру:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть', web_app: { url: WEBAPP_URL } }]
          ]
        }
      });
    } catch (err) {
      console.error('text error:', err.message);
    }
  });

  bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: 'Играть',
      web_app: { url: WEBAPP_URL }
    }
  }).then(() => {
    console.log('✅ Menu Button установлен');
  }).catch(err => {
    console.error('Menu Button error:', err.message);
  });

  bot.catch(err => console.error('Bot error:', err));

  bot.launch().then(() => {
    console.log('🤖 Telegram bot launched');
    console.log(`🌐 WebApp URL: ${WEBAPP_URL}`);
  }).catch(err => {
    console.error('❌ Bot launch failed:', err.message);
  });

  process.on('SIGINT', () => { bot.stop('SIGINT'); process.exit(); });
  process.on('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(); });
}
