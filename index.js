const TelegramBot = require("node-telegram-bot-api");
const {
  Client
} = require("ssh2");
const fs = require('fs');
const path = require('path');
const settings = require("./settings");
const owner = settings.adminId;
const botToken = settings.token;
const domain = settings.domain;
const plta = settings.plta;
const pltc = settings.pltc;
let premiumUsers = [];
let adminUsers = [];
try {
  premiumUsers = JSON.parse(fs.readFileSync('premiumUsers.json', "utf8"));
} catch (_0xb4ef81) {
  console.error("Error membaca file premiumUsers.json, menginisialisasi array kosong:", _0xb4ef81.message);
  premiumUsers = [];
}
try {
  adminUsers = JSON.parse(fs.readFileSync("adminID.json", "utf8"));
} catch (_0x1b8cad) {
  console.error("Error membaca file adminID.json, menginisialisasi array kosong:", _0x1b8cad.message);
  adminUsers = [];
}
const bot = new TelegramBot(botToken, {
  'polling': true
});
function generateRandomPassword() {
  let _0x5ea37e = '';
  for (let _0x4af623 = 0x0; _0x4af623 < 0x8; _0x4af623++) {
    const _0x1dbd45 = Math.floor(Math.random() * "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".length);
    _0x5ea37e += "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[_0x1dbd45];
  }
  return _0x5ea37e;
}
function getRuntime() {
  const _0x287f26 = process.uptime();
  const _0x24518c = Math.floor(_0x287f26 / 0xe10);
  const _0x2e6d31 = Math.floor(_0x287f26 % 0xe10 / 0x3c);
  const _0x30dccf = Math.floor(_0x287f26 % 0x3c);
  return _0x24518c + " Jam " + _0x2e6d31 + " Menit " + _0x30dccf + " Detik";
}
let videoCache = null;
let videoCachePath = null;
function loadVideoToCache() {
  if (videoCache) {
    return videoCache;
  }
  const _0x165bf0 = path.join(__dirname, "./assets/videos/Video.mp4");
  if (fs.existsSync(_0x165bf0)) {
    videoCachePath = _0x165bf0;
    videoCache = fs.readFileSync(_0x165bf0);
    return videoCache;
  }
  return null;
}
async function callPteroAPI(_0x150ce2, _0x23146d, _0x3c56f6 = null, _0x4e857d = "application") {
  const _0x52757f = domain + '/api/' + _0x4e857d + '/' + _0x23146d;
  const _0x46d118 = _0x4e857d === "application" ? plta : pltc;
  const _0x3f4a6f = {
    'method': _0x150ce2,
    'headers': {
      'Accept': "application/json",
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + _0x46d118
    }
  };
  if (_0x3c56f6) {
    _0x3f4a6f.body = JSON.stringify(_0x3c56f6);
  }
  try {
    const _0x5cc002 = await fetch(_0x52757f, _0x3f4a6f);
    if (!_0x5cc002.ok) {
      const _0x576cae = await _0x5cc002.json();
      throw new Error(JSON.stringify(_0x576cae.errors || _0x576cae, null, 0x2));
    }
    return await _0x5cc002.json();
  } catch (_0x2ba789) {
    console.error("Pterodactyl API Error (" + _0x150ce2 + " " + _0x23146d + '):', _0x2ba789.message);
    throw new Error("Pterodactyl API Error: " + _0x2ba789.message);
  }
}
async function executeSSHCommand(_0x45ec9b, _0x5cd5c3, _0x4a1f04, _0x29f969, _0x1fa20b, _0x475e4d) {
  return new Promise((_0x429862, _0x25305e) => {
    const _0x4a3200 = new Client();
    _0x4a3200.on("ready", () => {
      bot.sendMessage(_0x45ec9b, "Koneksi SSH berhasil dibuat. Mengeksekusi perintah...");
      _0x4a3200.exec(_0x4a1f04, (_0x284567, _0x3d5f5b) => {
        if (_0x284567) {
          bot.sendMessage(_0x45ec9b, "Error mengeksekusi perintah: " + _0x284567.message);
          _0x4a3200.end();
          return _0x25305e(_0x284567);
        }
        _0x3d5f5b.on("close", (_0xc3e9ca, _0x4468fe) => {
          console.log("Stream ditutup dengan kode " + _0xc3e9ca + " dan sinyal " + _0x4468fe);
          _0x4a3200.end();
          if (_0xc3e9ca === 0x0) {
            bot.sendMessage(_0x45ec9b, _0x1fa20b);
            _0x429862({
              'code': _0xc3e9ca,
              'signal': _0x4468fe
            });
          } else {
            bot.sendMessage(_0x45ec9b, _0x475e4d + " (Kode keluar: " + _0xc3e9ca + ')');
            _0x25305e(new Error("Perintah gagal dengan kode keluar " + _0xc3e9ca));
          }
        }).on("data", _0x316bd5 => {
          const _0x14077a = _0x316bd5.toString();
          console.log("STDOUT: " + _0x14077a);
          for (const _0x58e0c5 of _0x29f969) {
            if (_0x14077a.includes(_0x58e0c5.prompt)) {
              _0x3d5f5b.write(_0x58e0c5.response + "\n");
              console.log("Menanggapi \"" + _0x58e0c5.prompt + "\" dengan \"" + _0x58e0c5.response + "\"");
              break;
            }
          }
        }).stderr.on("data", _0x21061a => {
          console.error("STDERR: " + _0x21061a);
          bot.sendMessage(_0x45ec9b, "Error SSH: " + _0x21061a);
        });
      });
    }).on("error", _0x360bd5 => {
      let _0x5ee24f = "Koneksi SSH gagal.";
      if (_0x360bd5.message.includes("All configured authentication methods failed")) {
        _0x5ee24f = "Koneksi gagal: Kata sandi salah atau VPS tidak dapat diakses.";
      } else if (_0x360bd5.message.includes("connect ECONNREFUSED")) {
        _0x5ee24f = "Koneksi gagal: VPS tidak bisa diakses atau mati.";
      } else {
        _0x5ee24f = "Koneksi gagal: " + _0x360bd5.message;
      }
      bot.sendMessage(_0x45ec9b, _0x5ee24f);
      console.error("Connection Error: ", _0x360bd5.message);
      _0x25305e(_0x360bd5);
    }).connect(_0x5cd5c3);
  });
}
async function createPanelUserAndServer(_0x2feb08, _0x1336b9, _0xb77520, _0x263c75, _0x1695fe, _0x5b7487) {
  const _0xc9e646 = _0x263c75 === 0x0 ? 'unli' : _0x263c75 / 0x400 + 'gb';
  const _0x45cbdd = '' + _0x1336b9 + _0xc9e646;
  const _0x560b4c = _0x1336b9 + '@' + _0xc9e646 + '.buyer.lomz';
  const _0x22d3bc = generateRandomPassword();
  const _0x4d95ec = settings.eggs;
  const _0xd96ee6 = settings.loc;
  try {
    const _0x28f5c9 = await callPteroAPI("POST", "users", {
      'email': _0x560b4c,
      'username': _0x1336b9,
      'first_name': _0x1336b9,
      'last_name': _0x1336b9,
      'language': 'en',
      'password': _0x22d3bc
    });
    const _0x1ad199 = _0x28f5c9.attributes;
    const _0x2ddd0d = await callPteroAPI("POST", 'servers', {
      'name': _0x45cbdd,
      'description': '',
      'user': _0x1ad199.id,
      'egg': parseInt(_0x4d95ec),
      'docker_image': "ghcr.io/parkervcp/yolks:nodejs_18",
      'startup': "if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}",
      'environment': {
        'INST': "npm",
        'USER_UPLOAD': '0',
        'AUTO_UPDATE': '0',
        'CMD_RUN': "npm start"
      },
      'limits': {
        'memory': _0x263c75,
        'swap': 0x0,
        'disk': _0x5b7487,
        'io': 0x1f4,
        'cpu': _0x1695fe
      },
      'feature_limits': {
        'databases': 0x5,
        'backups': 0x5,
        'allocations': 0x1
      },
      'deploy': {
        'locations': [parseInt(_0xd96ee6)],
        'dedicated_ip': false,
        'port_range': []
      }
    });
    const _0x429a18 = _0x2ddd0d.attributes;
    bot.sendMessage(_0x2feb08, "🌸 𝐁𝐄𝐑𝐈𝐊𝐔𝐓𝐇 𝐃𝐀𝐓𝐀 𝐏𝐀𝐍𝐄𝐋𝐋 𝐊𝐀𝐌𝐔𝐔 🌸\n" + ("🎀 𝐍𝐀𝐌𝐀𝐀 : " + _0x1336b9 + "\n") + ("💌 𝐄𝐌𝐀𝐈𝐋𝐋 : " + _0x560b4c + "\n") + ("🆔 𝐈𝐃𝐃 : " + _0x1ad199.id + "\n") + ("💾 𝐌𝐄𝐌𝐎𝐑𝐘𝐘 : " + (_0x429a18.limits.memory === 0x0 ? "Unlimited" : _0x429a18.limits.memory) + " 𝐌𝐁\n") + ("📀 𝐃𝐈𝐒𝐊𝐊 : " + (_0x429a18.limits.disk === 0x0 ? 'Unlimited' : _0x429a18.limits.disk) + " 𝐌𝐁\n") + ("⚙️ 𝐂𝐏𝐔 : " + _0x429a18.limits.cpu + '%'));
    const _0x44450c = settings.pp;
    const _0xdf745 = "🌸 𝐇𝐚𝐥𝐨𝐨 @" + _0xb77520 + " 🌸\n\n" + "💫 𝐁𝐄𝐑𝐈𝐊𝐔𝐓𝐇 𝐃𝐀𝐓𝐀 𝐏𝐀𝐍𝐄𝐋𝐋 𝐊𝐀𝐌𝐔 💫\n" + ("〽️ 𝐋𝐨𝐠𝐢𝐧𝐧 : " + domain + "\n") + ("〽️ 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞𝐞 : " + _0x1ad199.username + "\n") + ("〽️ 𝐏𝐚𝐬𝐬𝐰𝐨𝐫𝐝𝐝 : " + _0x22d3bc + "\n") + "┏━━━━━━━⬣\n" + "│🌷 𝐑𝐔𝐋𝐄𝐒 𝐘𝐀𝐀 🌷\n" + "│• 𝐉𝐚𝐧𝐠𝐚𝐧𝐧 𝐃𝐃𝐨𝐒𝐒 𝐒𝐞𝐫𝐯𝐞𝐫𝐫 >.<\n" + "│• 𝐓𝐮𝐭𝐮𝐩𝐩 𝐝𝐨𝐦𝐚𝐢𝐧𝐧 𝐤𝐚𝐥𝐨 𝐬𝐜𝐬𝐡𝐨𝐭𝐭 🙈\n" + "│• 𝐆𝐚𝐤𝐤 𝐛𝐨𝐥𝐞𝐡𝐡 𝐛𝐚𝐠𝐢𝐢𝐧 𝐝𝐨𝐦𝐚𝐢𝐧𝐧 𝐡𝐡! 😡\n" + "┗━━━━━━━━━━━━━━━━━━⬣\n" + "🌸 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋𝐋 𝐁𝐘 𝐊𝐘𝐙𝐄𝐆𝐀𝐍𝐓𝐄𝐍𝐆 🌸";
    if (_0x44450c && fs.existsSync(_0x44450c)) {
      const _0x189181 = fs.statSync(_0x44450c);
      const _0x32d5b4 = _0x189181.size;
      const _0x59066f = _0x32d5b4 / 1048576;
      if (_0x59066f > 0x32) {
        bot.sendMessage(_0xb77520, "Video terlalu besar untuk dikirim. Ini data panel Anda:\n\n" + _0xdf745);
      } else {
        bot.sendAnimation(_0xb77520, _0x44450c, {
          'caption': _0xdf745
        });
      }
    } else if (_0x44450c) {
      bot.sendAnimation(_0xb77520, _0x44450c, {
        'caption': _0xdf745
      });
    } else {
      bot.sendMessage(_0xb77520, _0xdf745);
    }
    bot.sendMessage(_0x2feb08, "Data panel berhasil dikirim ke ID Telegram yang dimaksud.");
  } catch (_0x41fbb8) {
    let _0x43826f = "Gagal membuat data panel. Silakan coba lagi.";
    if (_0x41fbb8.message.includes('unique') && _0x41fbb8.message.includes("email")) {
      _0x43826f = "Email atau Username sudah terdaftar di Panel.";
    } else if (_0x41fbb8.message.includes("Pterodactyl API Error")) {
      _0x43826f = "Terjadi kesalahan API Pterodactyl: " + _0x41fbb8.message;
    } else {
      _0x43826f = "Terjadi kesalahan: " + _0x41fbb8.message;
    }
    bot.sendMessage(_0x2feb08, _0x43826f);
  }
}
bot.onText(/\/start/, _0x513e19 => {
  const _0x2d44bc = _0x513e19.chat.id;
  const _0x22a17a = loadVideoToCache();
  const _0xf70eb = {
    'caption': "🌸 𓆩♡𓆪 𝐇𝐚𝐥𝐨𝐨~\n𝐀𝐜𝐮 𝐚𝐝𝐚𝐥𝐚𝐡𝐡 𝐁𝐨𝐭 𝐂𝐏𝐀𝐍𝐄𝐋 𝐢𝐦𝐮𝐩𝐩~ 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐮𝐚𝐭 𝐨𝐥𝐞𝐡 @kyzee4you 💞  \n𝐠𝐮𝐧𝐚𝐤𝐚𝐧𝐧 𝐝𝐞𝐧𝐠𝐚𝐧𝐧 𝐛𝐚𝐢𝐤𝐤 𝐲𝐚𝐚𝐰~ 💕\n╭───────────────❀  \n│ 🌷 𝓡𝓤𝓛𝓔𝓢 🌷  \n│ 🚫 𝐍𝐎 𝐂𝐑𝐄𝐀𝐓𝐄 𝐃𝐈𝐈 𝐏𝐑𝐈𝐕𝐀𝐓𝐄 𝐁𝐎𝐓 𝐘𝐀𝐀𝐖𝐖  \n│ 🚫 𝐍𝐎 𝐒𝐏𝐀𝐌 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋𝐋 𝐘𝐀𝐍𝐆𝐆 𝐓𝐈𝐃𝐀𝐊 𝐃𝐈𝐆𝐔𝐍𝐀𝐊𝐀𝐍𝐍 𝐎𝐊𝐄𝐘𝐘~ 💕  \n╰───────────────❀  \n╭───────🍓 𝓢𝓣𝓐𝓣𝓤𝓢 𝓑𝓞𝓣 🍓  \n│ 💻 𝐍𝐀𝐌𝐀 : 𝐂𝐏𝐀𝐍𝐄𝐋 𝐈𝐌𝐔𝐏𝐏  \n│ 🟢 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄~  \n│ 🧁 𝐕𝐄𝐑𝐒𝐈 : 𝟏.𝟎  \n╰───────────────────♡\n🌼 𝐏𝐢𝐥𝐢𝐡𝐡 𝐦𝐞𝐧𝐮𝐮 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐚𝐰𝐚𝐡𝐡 𝐲𝐚𝐰𝐰~♡ : \n",
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "🌸 𝐂𝐄𝐊𝐈𝐃 🌸",
        'callback_data': "cekid"
      }, {
        'text': "🌷 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋 🌷",
        'callback_data': 'createpanel'
      }], [{
        'text': "🍓 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐏𝐀𝐍𝐄𝐋 🍓",
        'callback_data': "installpanel"
      }, {
        'text': "🌼 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐓𝐇𝐄𝐌𝐀 🌼",
        'callback_data': "installthema"
      }], [{
        'text': "🎀 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔 🎀",
        'callback_data': 'ownermenu'
      }, {
        'text': "💞 𝐎𝐖𝐍𝐄𝐑 💞",
        'callback_data': "owner"
      }], [{
        'text': "🧁 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 🧁",
        'url': "https://t.me/KyzeChannel"
      }]]
    }
  };
  if (_0x22a17a) {
    bot.sendVideo(_0x2d44bc, _0x22a17a, _0xf70eb)['catch'](_0x399e4d => {
      console.error("Error sending video for /start:", _0x399e4d.message);
      bot.sendMessage(_0x2d44bc, "🌸 𓆩♡𓆪 𝐇𝐚𝐥𝐨𝐨~\n𝐀𝐜𝐮 𝐚𝐝𝐚𝐥𝐚𝐡𝐡 𝐁𝐨𝐭 𝐂𝐏𝐀𝐍𝐄𝐋 𝐢𝐦𝐮𝐩𝐩~ 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐮𝐚𝐭 𝐨𝐥𝐞𝐡 @kyzee4you 💞  \n𝐠𝐮𝐧𝐚𝐤𝐚𝐧𝐧 𝐝𝐞𝐧𝐠𝐚𝐧𝐧 𝐛𝐚𝐢𝐤𝐤 𝐲𝐚𝐚𝐰~ 💕\n╭───────────────❀  \n│ 🌷 𝓡𝓤𝓛𝓔𝓢 🌷  \n│ 🚫 𝐍𝐎 𝐂𝐑𝐄𝐀𝐓𝐄 𝐃𝐈𝐈 𝐏𝐑𝐈𝐕𝐀𝐓𝐄 𝐁𝐎𝐓 𝐘𝐀𝐀𝐖𝐖  \n│ 🚫 𝐍𝐎 𝐒𝐏𝐀𝐌 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋𝐋 𝐘𝐀𝐍𝐆𝐆 𝐓𝐈𝐃𝐀𝐊 𝐃𝐈𝐆𝐔𝐍𝐀𝐊𝐀𝐍𝐍 𝐎𝐊𝐄𝐘𝐘~ 💕  \n╰───────────────❀  \n╭───────🍓 𝓢𝓣𝓐𝓣𝓤𝓢 𝓑𝓞𝓣 🍓  \n│ 💻 𝐍𝐀𝐌𝐀 : 𝐂𝐏𝐀𝐍𝐄𝐋 𝐈𝐌𝐔𝐏𝐏  \n│ 🟢 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄~  \n│ 🧁 𝐕𝐄𝐑𝐒𝐈 : 𝟏.𝟎  \n╰───────────────────♡\n🌼 𝐏𝐢𝐥𝐢𝐡𝐡 𝐦𝐞𝐧𝐮𝐮 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐚𝐰𝐚𝐡𝐡 𝐲𝐚𝐰𝐰~♡ : \n", _0xf70eb);
    });
  } else {
    bot.sendMessage(_0x2d44bc, "🌸 𓆩♡𓆪 𝐇𝐚𝐥𝐨𝐨~\n𝐀𝐜𝐮 𝐚𝐝𝐚𝐥𝐚𝐡𝐡 𝐁𝐨𝐭 𝐂𝐏𝐀𝐍𝐄𝐋 𝐢𝐦𝐮𝐩𝐩~ 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐮𝐚𝐭 𝐨𝐥𝐞𝐡 @kyzee4you 💞  \n𝐠𝐮𝐧𝐚𝐤𝐚𝐧𝐧 𝐝𝐞𝐧𝐠𝐚𝐧𝐧 𝐛𝐚𝐢𝐤𝐤 𝐲𝐚𝐚𝐰~ 💕\n╭───────────────❀  \n│ 🌷 𝓡𝓤𝓛𝓔𝓢 🌷  \n│ 🚫 𝐍𝐎 𝐂𝐑𝐄𝐀𝐓𝐄 𝐃𝐈𝐈 𝐏𝐑𝐈𝐕𝐀𝐓𝐄 𝐁𝐎𝐓 𝐘𝐀𝐀𝐖𝐖  \n│ 🚫 𝐍𝐎 𝐒𝐏𝐀𝐌 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋𝐋 𝐘𝐀𝐍𝐆𝐆 𝐓𝐈𝐃𝐀𝐊 𝐃𝐈𝐆𝐔𝐍𝐀𝐊𝐀𝐍𝐍 𝐎𝐊𝐄𝐘𝐘~ 💕  \n╰───────────────❀  \n╭───────🍓 𝓢𝓣𝓐𝓣𝓤𝓢 𝓑𝓞𝓣 🍓  \n│ 💻 𝐍𝐀𝐌𝐀 : 𝐂𝐏𝐀𝐍𝐄𝐋 𝐈𝐌𝐔𝐏𝐏  \n│ 🟢 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄~  \n│ 🧁 𝐕𝐄𝐑𝐒𝐈 : 𝟏.𝟎  \n╰───────────────────♡\n🌼 𝐏𝐢𝐥𝐢𝐡𝐡 𝐦𝐞𝐧𝐮𝐮 𝐲𝐚𝐧𝐠𝐠 𝐝𝐢𝐛𝐚𝐰𝐚𝐡𝐡 𝐲𝐚𝐰𝐰~♡ : \n", _0xf70eb);
  }
});
bot.on('callback_query', _0x4ec5fb => {
  const _0x7cc16c = _0x4ec5fb.message.chat.id;
  const _0xbfb4c6 = _0x4ec5fb.message.message_id;
  const _0x4dc8c5 = _0x4ec5fb.data;
  bot.answerCallbackQuery(_0x4ec5fb.id);
  let _0x560a59 = '';
  let _0xd36ee8 = {
    'inline_keyboard': [[{
      'text': "🌸 𝐂𝐄𝐊𝐈𝐃 🌸",
      'callback_data': "cekid"
    }, {
      'text': "🌷 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋 🌷",
      'callback_data': "createpanel"
    }], [{
      'text': "🍓 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐏𝐀𝐍𝐄𝐋 🍓",
      'callback_data': "installpanel"
    }, {
      'text': "🌼 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐓𝐇𝐄𝐌𝐀 🌼",
      'callback_data': "installthema"
    }], [{
      'text': "🎀 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔 🎀",
      'callback_data': "ownermenu"
    }, {
      'text': "💞 𝐎𝐖𝐍𝐄𝐑 💞",
      'callback_data': "owner"
    }], [{
      'text': "🧁 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 🧁",
      'url': 'https://t.me/KyzeChannel'
    }]]
  };
  switch (_0x4dc8c5) {
    case "owner":
      bot.sendMessage(_0x4ec5fb.from.id, "OWNER @kyzee4you");
      return;
    case "start":
      _0x560a59 = "\n─────────────\n✨ 𝐊𝐞𝐭𝐢𝐤 /𝐬𝐭𝐚𝐫𝐭 𝐮𝐧𝐭𝐮𝐤 𝐤𝐞𝐦𝐛𝐚𝐥𝐢\n🌙 𝐊𝐞 𝐚𝐰𝐚𝐥 𝐦𝐞𝐧𝐮\n©️ 𝐁𝐲 𝐊𝐲𝐳𝐞 💫";
      break;
    case "createpanel":
      _0x560a59 = "🌸┏━⬣『 𝐂𝐑𝐄𝐀𝐓𝐄 𝐏𝐀𝐍𝐄𝐋 🌸』\n│› /1gb user,idtele ( 💎 Premium )\n║› /2gb user,idtele ( 💎 Premium )\n│› /3gb user,idtele ( 💎 Premium )\n║› /4gb user,idtele ( 💎 Premium )\n│› /5gb user,idtele ( 💎 Premium )\n║› /6gb user,idtele ( 💎 Premium )\n│› /7gb user,idtele ( 💎 Premium )\n║› /8gb user,idtele ( 💎 Premium )\n│› /9gb user,idtele ( 💎 Premium )\n║› /10gb user,idtele ( 💎 Premium )\n│› /11gb user,idtele ( 💎 Premium )\n║› /12gb user,idtele ( 💎 Premium )\n│› /13gb user,idtele ( 💎 Premium )\n║› /14gb user,idtele ( 💎 Premium )\n│› /15gb user,idtele ( 💎 Premium )\n║› /unli user,idtele ( 💎 Premium )\n│› /adp user,idtele ( 👑 Owner )\n┗━━━━━━━━━━⬣🌸\n⿻ 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 🌷𝐤𝐲𝐳𝐞";
      break;
    case 'cekid':
      _0x560a59 = "┏━⌲✨𝐒𝐈𝐋𝐀𝐇𝐊𝐀𝐍 𝐂𝐄𝐊 𝐈𝐃 𝐀𝐍𝐃𝐀✨\n│\n║› /𝐜𝐞𝐤𝐢𝐝𝐭𝐞𝐥𝐞𝐠𝐫𝐚𝐦\n│\n┗━━━━━━━⬣\n⿻ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 💫𝐊𝐲𝐳𝐞💫";
      break;
    case 'ownermenu':
      _0x560a59 = "┏━⬣『 💞 𝐎𝐖𝐍𝐄𝐑𝐌𝐄𝐍𝐔 💞 』\n│› /addowner ID Telegram\n║› /addprem ID Telegram\n│› /delowner ID Telegram\n║› /delprem ID Telegram\n│› /listsrv ( List Server Di Panel )\n║› /delsrv ID Server\n│› /listadmin ( List User Admin Di Panel )\n║› /listusr ( List User Di Panel )\n│› /delusr ID User\n║› /adp Nama,ID Telegram\n│› /payment ( List Method Pembayaran )\n║› /listprem ( List Pengguna Premium )\n│› /startsrv ID Server\n║› /stopsrv ID Server\n│› /restartsrv ID Server\n║› /killsrv ID Server\n│› /srvinfo ID Server\n║› /usrinfo ID User\n│› /updatesrv ID Server,mem,disk,cpu,alloc,db,backup\n║› /reinstallsrv ID Server\n│› /suspendusr ID User\n║› /unsuspendusr ID User\n│› /suspendrv ID Server\n║› /unsuspendrv ID Server\n┗━━━━━━━━━━⬣🌸\n⿻ 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 🌷 @kyzee4you;";
      break;
    case 'installthema':
      _0x560a59 = "🌸┏━━⬣『 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐓𝐇𝐄𝐌𝐀 🌸』\n│› /𝐢𝐧𝐬𝐭𝐚𝐥𝐥𝐞𝐧𝐢𝐠𝐦𝐚 (𝐬𝐨𝐨𝐧)\n║› /𝐬𝐭𝐞𝐥𝐥𝐚𝐫 𝐢𝐩𝐯𝐩𝐬,𝐩𝐚𝐬𝐬𝐰𝐨𝐫𝐝\n│› /𝐞𝐥𝐲𝐬𝐢𝐮𝐦 𝐢𝐩𝐯𝐩𝐬,𝐩𝐚𝐬𝐬𝐰𝐨𝐫𝐝\n║› /𝐢𝐧𝐬𝐭𝐚𝐥𝐥𝐞𝐧𝐢𝐠𝐦𝐚 (𝐬𝐨𝐨𝐧)\n│› /𝐮𝐧𝐢𝐧𝐬𝐭𝐚𝐥𝐥𝐭𝐡𝐞𝐦𝐚 𝐢𝐩𝐯𝐩𝐬,𝐩𝐚𝐬𝐬𝐰𝐨𝐫𝐝\n║› /𝐢𝐧𝐬𝐭𝐚𝐥𝐥𝐝𝐞𝐩𝐞𝐧𝐝 𝐢𝐩𝐯𝐩𝐬,𝐩𝐚𝐬𝐬𝐰𝐨𝐫𝐝\n┗━━━━━━━⬣🌷\n⿻ 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 🌸 @kyzee4you";
      break;
    case "installpanel":
      _0x560a59 = "🌸┏━━⬣『 𝐈𝐍𝐒𝐓𝐀𝐋𝐋 𝐏𝐀𝐍𝐄𝐋 𝐈𝐌𝐔𝐏𝐏 🌸』\n│› /installpanel1 ipvps,passwordvps,domainpnl,domainnode,ramvps\n║ [ubuntu22/24]\n│› /installpanel2 ipvps,passwordvps,domainpnl,domainnode,ramvps\n║ [ubuntu20deb11/12]\n│› /uninstallpanel ipvps,password\n║› /wings ipvps,password,token\n│› /hackback ipvps,password\n┗━━━━━━━⬣🌷\n⿻ 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓑𝔂 🌸 @kyzee4you";
      break;
    default:
      try {
        const _0xa132c = JSON.parse(_0x4dc8c5);
        if (_0xa132c.action === "next" || _0xa132c.action === 'back') {
          handleListAdminPagination(_0x4ec5fb, _0xa132c.page);
          return;
        }
      } catch (_0x3f8b85) {
        console.error("Error parsing callback data:", _0x3f8b85);
      }
      _0x560a59 = "Pilihan tidak valid.";
      break;
  }
  bot.editMessageCaption(_0x560a59, {
    'chat_id': _0x7cc16c,
    'message_id': _0xbfb4c6,
    'reply_markup': _0xd36ee8,
    'parse_mode': "Markdown"
  })["catch"](_0x240e22 => console.error("Error editing message caption:", _0x240e22.message));
});
bot.onText(/\/addprem (.+)/, async (_0x23047e, _0xb376aa) => {
  const _0x175547 = _0x23047e.chat.id;
  const _0x1a50a0 = _0xb376aa[0x1].trim();
  if (_0x23047e.from.id.toString() === owner) {
    if (!premiumUsers.includes(_0x1a50a0)) {
      premiumUsers.push(_0x1a50a0);
      fs.writeFileSync('premiumUsers.json', JSON.stringify(premiumUsers));
      bot.sendMessage(_0x175547, "𝐔𝐬𝐞𝐫 " + _0x1a50a0 + " 𝐃𝐢𝐚𝐧𝐠𝐤𝐚𝐭 𝐌𝐞𝐧𝐣𝐚𝐝𝐢 𝐔𝐬𝐞𝐫 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 💎.");
    } else {
      bot.sendMessage(_0x175547, "𝐔𝐬𝐞𝐫 " + _0x1a50a0 + " 𝐒𝐮𝐝𝐚𝐡 𝐌𝐞𝐧𝐣𝐚𝐝𝐢 𝐏𝐞𝐧𝐠𝐠𝐮𝐧𝐚 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 💎");
    }
  } else {
    bot.sendMessage(_0x175547, "𝐇𝐚𝐧𝐲𝐚 𝐏𝐞𝐦𝐢𝐥𝐢𝐤 𝐘𝐚𝐧𝐠 𝐃𝐚𝐩𝐚𝐭 𝐌𝐞𝐥𝐚𝐤𝐮𝐤𝐚𝐧 𝐓𝐢𝐧𝐝𝐚𝐤𝐚𝐧 𝐈𝐧𝐢 🌷");
  }
});
bot.onText(/\/delprem (.+)/, async (_0xb6ecd6, _0xd9c2e9) => {
  const _0x4df4b6 = _0xb6ecd6.chat.id;
  const _0x310001 = _0xd9c2e9[0x1].trim();
  if (_0xb6ecd6.from.id.toString() === owner) {
    const _0x179865 = premiumUsers.indexOf(_0x310001);
    if (_0x179865 !== -0x1) {
      premiumUsers.splice(_0x179865, 0x1);
      fs.writeFileSync('premiumUsers.json', JSON.stringify(premiumUsers));
      bot.sendMessage(_0x4df4b6, "🌸𝐔𝐬𝐞𝐫 " + _0x310001 + " 𝐒𝐮𝐝𝐚𝐡 𝐓𝐢𝐝𝐚𝐤 𝐋𝐚𝐠𝐢 𝐔𝐬𝐞𝐫 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 🌸.");
    } else {
      bot.sendMessage(_0x4df4b6, "🌸𝐔𝐬𝐞𝐫 " + _0x310001 + " 𝐁𝐮𝐤𝐚𝐧 𝐏𝐞𝐧𝐠𝐠𝐮𝐧𝐚 𝐏𝐫𝐞𝐦𝐢𝐮𝐦🌷");
    }
  } else {
    bot.sendMessage(_0x4df4b6, "𝐇𝐚𝐧𝐲𝐚 𝐏𝐞𝐦𝐢𝐥𝐢𝐤 𝐘𝐚𝐧𝐠 𝐃𝐚𝐩𝐚𝐭 𝐌𝐞𝐥𝐚𝐤𝐮𝐤𝐚𝐧 𝐓𝐢𝐧𝐝𝐚𝐤𝐚𝐧 𝐈𝐧𝐢 🌷.");
  }
});
bot.onText(/\/addowner (.+)/, async (_0x40a714, _0x5f0fc7) => {
  const _0x3698f3 = _0x40a714.chat.id;
  const _0x5bdc02 = _0x5f0fc7[0x1].trim();
  if (_0x40a714.from.id.toString() === owner) {
    if (!adminUsers.includes(_0x5bdc02)) {
      adminUsers.push(_0x5bdc02);
      fs.writeFileSync("adminID.json", JSON.stringify(adminUsers));
      bot.sendMessage(_0x3698f3, "🌸𝐔𝐬𝐞𝐫 " + _0x5bdc02 + " 𝐃𝐢𝐚𝐧𝐠𝐤𝐚𝐭 𝐌𝐞𝐧𝐣𝐚𝐝𝐢 𝐎𝐰𝐧𝐞𝐫 👑.");
    } else {
      bot.sendMessage(_0x3698f3, "🌸𝐔𝐬𝐞𝐫 " + _0x5bdc02 + " 𝐒𝐮𝐝𝐚𝐡 𝐌𝐞𝐧𝐣𝐚𝐝𝐢 𝐏𝐞𝐧𝐠𝐠𝐮𝐧𝐚 𝐀𝐝𝐦𝐢𝐧🌷.");
    }
  } else {
    bot.sendMessage(_0x3698f3, "𝐇𝐚𝐧𝐲𝐚 𝐏𝐞𝐦𝐢𝐥𝐢𝐤 𝐘𝐚𝐧𝐠 𝐃𝐚𝐩𝐚𝐭 𝐌𝐞𝐥𝐚𝐤𝐮𝐤𝐚𝐧 𝐓𝐢𝐧𝐝𝐚𝐤𝐚𝐧 𝐈𝐧𝐢 🌷.");
  }
});
bot.onText(/\/delowner (.+)/, async (_0x3e6c9a, _0x4ebcf7) => {
  const _0x3b789e = _0x3e6c9a.chat.id;
  const _0x44c2aa = _0x4ebcf7[0x1].trim();
  if (_0x3e6c9a.from.id.toString() === owner) {
    const _0x4b79f6 = adminUsers.indexOf(_0x44c2aa);
    if (_0x4b79f6 !== -0x1) {
      adminUsers.splice(_0x4b79f6, 0x1);
      fs.writeFileSync("adminID.json", JSON.stringify(adminUsers));
      bot.sendMessage(_0x3b789e, "User " + _0x44c2aa + " Telah Di Delowner Oleh kyze.");
    } else {
      bot.sendMessage(_0x3b789e, "User " + _0x44c2aa + " bukan pengguna admin.");
    }
  } else {
    bot.sendMessage(_0x3b789e, "Hanya pemilik yang dapat melakukan tindakan ini.");
  }
});
bot.onText(/\/cekidtelegram/, _0x283c9f => {
  const _0x29b3bf = _0x283c9f.chat.id;
  const _0x2c6c9d = _0x283c9f.from.username;
  const _0x535c48 = _0x283c9f.from.id;
  const _0x5240c6 = "🌷 𝐇𝐢 @" + _0x2c6c9d + " 🌷\n┏━━━━━⬣\n│› 🪄 𝐈𝐃 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐀𝐧𝐝𝐚 : " + _0x535c48 + "\n│› 💖 𝐍𝐚𝐦𝐚 𝐋𝐞𝐧𝐠𝐤𝐚𝐩 𝐀𝐧𝐝𝐚 : @" + _0x2c6c9d + "\n┗━━━━━━━⬣\n⿻ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 : 🌸 #𝐤𝐲𝐳𝐞 🌸";
  const _0x377864 = {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "🧁 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 🧁",
        'url': "https://t.me/KyzeChannel"
      }, {
        'text': "Daftar Produk Lainnya",
        'url': '-'
      }], [{
        'text': "💞 𝐎𝐖𝐍𝐄𝐑 💞",
        'url': "https://t.me/kyzee4you"
      }]]
    }
  };
  bot.sendAnimation(_0x29b3bf, settings.pp, {
    'caption': _0x5240c6,
    'parse_mode': "Markdown",
    'reply_markup': _0x377864
  })["catch"](_0x50e9d4 => {
    console.error("Error mengirim animasi untuk /id:", _0x50e9d4.message);
    bot.sendMessage(_0x29b3bf, _0x5240c6, {
      'parse_mode': "Markdown",
      'reply_markup': _0x377864
    });
  });
});
const panelCommands = {
  '1gb': {
    'memo': 0x400,
    'cpu': 0x1e,
    'disk': 0x400
  },
  '2gb': {
    'memo': 0x800,
    'cpu': 0x3c,
    'disk': 0x800
  },
  '3gb': {
    'memo': 0xc00,
    'cpu': 0x5a,
    'disk': 0xc00
  },
  '4gb': {
    'memo': 0x1000,
    'cpu': 0x6e,
    'disk': 0x1000
  },
  '5gb': {
    'memo': 0x1400,
    'cpu': 0x8c,
    'disk': 0x1400
  },
  '6gb': {
    'memo': 0x1800,
    'cpu': 0xaa,
    'disk': 0x1800
  },
  '7gb': {
    'memo': 0x1c00,
    'cpu': 0xc8,
    'disk': 0x1c00
  },
  '8gb': {
    'memo': 0x2000,
    'cpu': 0xe6,
    'disk': 0x2000
  },
  '9gb': {
    'memo': 0x2400,
    'cpu': 0x104,
    'disk': 0x2400
  },
  '10gb': {
    'memo': 0x2800,
    'cpu': 0x122,
    'disk': 0x2800
  },
  '11gb': {
    'memo': 0x2c00,
    'cpu': 0x122,
    'disk': 0x2c00
  },
  '12gb': {
    'memo': 0x3000,
    'cpu': 0x122,
    'disk': 0x3000
  },
  '13gb': {
    'memo': 0x3400,
    'cpu': 0x122,
    'disk': 0x3400
  },
  '14gb': {
    'memo': 0x3800,
    'cpu': 0x122,
    'disk': 0x3800
  },
  '15gb': {
    'memo': 0x3c00,
    'cpu': 0x122,
    'disk': 0x3c00
  },
  'unli': {
    'memo': 0x0,
    'cpu': 0x0,
    'disk': 0x0
  }
};
for (const [command, resources] of Object.entries(panelCommands)) {
  bot.onText(new RegExp("\\/" + command + " (.+)"), async (_0x22b8d6, _0x2e00e9) => {
    const _0x451c4e = _0x22b8d6.chat.id;
    const _0x381f1b = _0x2e00e9[0x1];
    const _0x45a645 = premiumUsers.includes(String(_0x22b8d6.from.id));
    if (!_0x45a645) {
      bot.sendMessage(_0x451c4e, "Maaf, fitur ini hanya untuk pengguna premium. Silakan hubungi admin untuk menjadi premium.", {
        'reply_markup': {
          'inline_keyboard': [[{
            'text': "HUBUNGI ADMIN",
            'url': "https://t.me/kyzee4you"
          }]]
        }
      });
      return;
    }
    const _0x41e456 = _0x381f1b.split(',');
    if (_0x41e456.length < 0x2) {
      bot.sendMessage(_0x451c4e, "Format salah. Penggunaan: /" + command + " namapanel,idtele");
      return;
    }
    const _0x50e669 = _0x41e456[0x0].trim();
    const _0x4be340 = _0x41e456[0x1].trim();
    await createPanelUserAndServer(_0x451c4e, _0x50e669, _0x4be340, resources.memo, resources.cpu, resources.disk);
  });
}
bot.onText(/\/adp (.+)/, async (_0x12a62b, _0x44568a) => {
  const _0x2104fb = _0x12a62b.chat.id;
  const _0x2e4733 = _0x12a62b.from.id;
  const _0x4f6d18 = adminUsers.includes(String(_0x2e4733));
  if (!_0x4f6d18) {
    bot.sendMessage(_0x2104fb, "𝐘𝐚𝐡𝐡~ 𝐊𝐚𝐦𝐮 𝐁𝐮𝐤𝐚𝐧 𝐎𝐰𝐧𝐞𝐫 𝐌𝐢𝐧𝐭𝐚 𝐃𝐮𝐥𝐮 𝐘𝐚𝐚 𝐊𝐞𝐞 @kyzee4you 💗", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "𝐇𝐮𝐛𝐮𝐧𝐠𝐢 𝐀𝐝𝐦𝐢𝐧 💞🧸",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  const _0x567c45 = _0x44568a[0x1].split(',');
  if (_0x567c45.length < 0x2) {
    bot.sendMessage(_0x2104fb, "Format Salah! Penggunaan: /adp namapanel,idtele");
    return;
  }
  const _0x1788c3 = _0x567c45[0x0].trim();
  const _0x17cb70 = _0x567c45[0x1].trim();
  const _0x26d6f1 = generateRandomPassword();
  try {
    const _0x44367b = await callPteroAPI('POST', "users", {
      'email': _0x1788c3 + "@Admin.kyze",
      'username': _0x1788c3,
      'first_name': _0x1788c3,
      'last_name': "Memb",
      'language': 'en',
      'root_admin': true,
      'password': _0x26d6f1
    });
    const _0x4caa15 = _0x44367b.attributes;
    const _0x3b4257 = "\nTYPE: user  \n➟ 🆔 ID: " + _0x4caa15.id + "  \n➟ 💫 USERNAME: " + _0x4caa15.username + "  \n➟ 💌 EMAIL: " + _0x4caa15.email + "  \n➟ 🎀 NAME: " + _0x4caa15.first_name + " " + _0x4caa15.last_name + "  \n➟ 🌷 LANGUAGE: " + _0x4caa15.language + "  \n➟ 👑 ADMIN: " + _0x4caa15.root_admin + "  \n➟ ⏰ CREATED AT: " + _0x4caa15.created_at + "\n        ";
    bot.sendMessage(_0x2104fb, _0x3b4257);
    bot.sendMessage(_0x17cb70, "\n┏━⬣❏「 𝐁𝐄𝐑𝐈𝐊𝐔𝐓 𝐃𝐀𝐓𝐀 𝐀𝐃𝐌𝐈𝐍 𝐏𝐀𝐍𝐄𝐋 𝐀𝐍𝐃𝐀 」❏\n│➥  〽️ 𝐋𝐨𝐠𝐢𝐧 : " + domain + "\n│➥  💫 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞 : " + _0x4caa15.username + "\n│➥  🔐 𝐏𝐚𝐬𝐬𝐰𝐨𝐫𝐝 : " + _0x26d6f1 + "\n┗━━━━━━━━━⬣🌷\n│  𝐑𝐮𝐥𝐞𝐬 :\n│• 𝐉𝐚𝐧𝐠𝐚𝐧 𝐂𝐮𝐫𝐢 𝐒𝐂\n│• 𝐉𝐚𝐧𝐠𝐚𝐧 𝐁𝐮𝐤𝐚 𝐏𝐚𝐧𝐞𝐥 𝐎𝐫𝐚𝐧𝐠\n│• 𝐉𝐚𝐧𝐠𝐚𝐧 𝐃𝐃𝐨𝐬 𝐒𝐞𝐫𝐯𝐞𝐫\n│• 𝐊𝐚𝐥𝐨 𝐣𝐮𝐚𝐥𝐚𝐧 𝐬𝐞𝐧𝐬𝐨𝐫 𝐝𝐨𝐦𝐚𝐢𝐧𝐧𝐲𝐚\n│• 𝐉𝐚𝐧𝐠𝐚𝐧 𝐁𝐚𝐠𝐢² 𝐏𝐚𝐧𝐞𝐥 𝐅𝐫𝐞𝐞 !!\n┗━━━━━━━━━━━━━━━━━━⬣\n𝓝𝓞𝓣𝐄 : 𝐬𝐞𝐭𝐞𝐥𝐚𝐡 𝐥𝐨𝐠𝐢𝐧 𝐝𝐢𝐰𝐚𝐣𝐢𝐛𝐤𝐚𝐧 𝐮𝐧𝐭𝐮𝐤 𝐦𝐞𝐧𝐠𝐠𝐚𝐧𝐭𝐢 𝐩𝐰\n🌷 𝐓𝐇𝐀𝐍𝐊𝐒 𝐅𝐎𝐑 𝐁𝐔𝐘 𝐃𝐈 𝐊𝐘𝐙𝐄 ✅\n            ");
  } catch (_0x228d24) {
    let _0x596bbd = "Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti.";
    if (_0x228d24.message.includes("unique") && _0x228d24.message.includes("email")) {
      _0x596bbd = "Email atau Username sudah terdaftar di Panel.";
    } else if (_0x228d24.message.includes("Pterodactyl API Error")) {
      _0x596bbd = "Terjadi kesalahan API Pterodactyl: " + _0x228d24.message;
    } else {
      _0x596bbd = "Terjadi kesalahan: " + _0x228d24.message;
    }
    bot.sendMessage(_0x2104fb, _0x596bbd);
  }
});
bot.onText(/\/listsrv/, async _0x37a0e2 => {
  const _0x488ba3 = _0x37a0e2.chat.id;
  const _0x8a89d9 = adminUsers.includes(String(_0x37a0e2.from.id));
  if (!_0x8a89d9) {
    bot.sendMessage(_0x488ba3, "Perintah Hanya Untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  try {
    let _0x2353b2 = await callPteroAPI("GET", "servers?page=1");
    let _0x46783a = _0x2353b2.data;
    let _0x525e1f = "Daftar server aktif yang dimiliki:\n\n";
    for (let _0x4a85dc of _0x46783a) {
      let _0x55060f = _0x4a85dc.attributes;
      let _0x1dd27c = "Unknown";
      try {
        const _0x44c416 = await callPteroAPI("GET", "servers/" + _0x55060f.uuid.split('-')[0x0] + '/resources', null, 'client');
        _0x1dd27c = _0x44c416.attributes.current_state;
      } catch (_0x2d174d) {
        console.warn("Tidak dapat mendapatkan status real-time untuk server " + _0x55060f.id + ": " + _0x2d174d.message);
        _0x1dd27c = _0x55060f.status || "Offline/Tidak Terjangkau";
      }
      _0x525e1f += "ID Server: " + _0x55060f.id + "\n";
      _0x525e1f += "Nama Server: " + _0x55060f.name + "\n";
      _0x525e1f += "Status: " + _0x1dd27c + "\n\n";
    }
    _0x525e1f += "Halaman: " + _0x2353b2.meta.pagination.current_page + '/' + _0x2353b2.meta.pagination.total_pages + "\n";
    _0x525e1f += "Total Server: " + _0x2353b2.meta.pagination.count;
    const _0x4c27de = [[{
      'text': "BACK",
      'callback_data': JSON.stringify({
        'action': "back",
        'page': parseInt(_0x2353b2.meta.pagination.current_page) - 0x1
      })
    }, {
      'text': "NEXT",
      'callback_data': JSON.stringify({
        'action': 'next',
        'page': parseInt(_0x2353b2.meta.pagination.current_page) + 0x1
      })
    }]];
    bot.sendMessage(_0x488ba3, _0x525e1f, {
      'reply_markup': {
        'inline_keyboard': _0x4c27de
      }
    });
  } catch (_0x6ccd03) {
    console.error(_0x6ccd03);
    bot.sendMessage(_0x488ba3, "Terjadi kesalahan dalam memproses permintaan: " + _0x6ccd03.message);
  }
});
bot.onText(/\/listprem/, _0xfb4a27 => {
  const _0x250e3e = _0xfb4a27.chat.id;
  const _0x5966f1 = adminUsers.includes(String(_0xfb4a27.from.id));
  if (!_0x5966f1) {
    bot.sendMessage(_0x250e3e, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': 'https://t.me/kyzee4you'
        }]]
      }
    });
    return;
  }
  if (premiumUsers.length === 0x0) {
    bot.sendMessage(_0x250e3e, "Tidak ada pengguna premium terdaftar.");
    return;
  }
  let _0x4cf1e8 = "Daftar Pengguna Premium:\n\n";
  premiumUsers.forEach((_0x41386e, _0x566f3f) => {
    _0x4cf1e8 += _0x566f3f + 0x1 + ". ```" + _0x41386e + "```\n";
  });
  bot.sendMessage(_0x250e3e, _0x4cf1e8, {
    'parse_mode': "Markdown"
  });
});
bot.onText(/\/startsrv (.+)/, async (_0x362660, _0x55c09e) => powerServer(_0x362660, _0x55c09e[0x1], "start"));
bot.onText(/\/stopsrv (.+)/, async (_0x5853cb, _0x2b24ec) => powerServer(_0x5853cb, _0x2b24ec[0x1], "stop"));
bot.onText(/\/restartsrv (.+)/, async (_0x529db2, _0x45bf46) => powerServer(_0x529db2, _0x45bf46[0x1], 'restart'));
bot.onText(/\/killsrv (.+)/, async (_0x1361be, _0x8e4273) => powerServer(_0x1361be, _0x8e4273[0x1], "kill"));
async function powerServer(_0x85a0b8, _0x2f6be2, _0x1cde3d) {
  const _0x54fd04 = _0x85a0b8.chat.id;
  const _0x2890e9 = adminUsers.includes(String(_0x85a0b8.from.id));
  if (!_0x2890e9) {
    bot.sendMessage(_0x54fd04, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  if (!_0x2f6be2) {
    bot.sendMessage(_0x54fd04, "Format salah. Penggunaan: /" + _0x1cde3d + "srv <server_id>");
    return;
  }
  try {
    const _0x26ea7d = await callPteroAPI("GET", "servers?filter[id]=" + _0x2f6be2);
    if (!_0x26ea7d.data || _0x26ea7d.data.length === 0x0) {
      bot.sendMessage(_0x54fd04, "Server dengan ID " + _0x2f6be2 + " tidak ditemukan.");
      return;
    }
    const _0x2c763c = _0x26ea7d.data[0x0].attributes.uuid.split('-')[0x0];
    await callPteroAPI("POST", "servers/" + _0x2c763c + '/power', {
      'signal': _0x1cde3d
    }, "client");
    bot.sendMessage(_0x54fd04, "Perintah " + _0x1cde3d.toUpperCase() + " berhasil dikirim ke server " + _0x2f6be2 + '.');
  } catch (_0x32d437) {
    bot.sendMessage(_0x54fd04, "Gagal melakukan aksi " + _0x1cde3d + " pada server " + _0x2f6be2 + ": " + _0x32d437.message);
  }
}
bot.onText(/\/delsrv (.+)/, async (_0x3572f7, _0xa12189) => {
  const _0x5c4133 = _0x3572f7.chat.id;
  const _0x3c03e0 = _0xa12189[0x1].trim();
  const _0x4b1f07 = adminUsers.includes(String(_0x3572f7.from.id));
  if (!_0x4b1f07) {
    bot.sendMessage(_0x5c4133, "Perintah hanya untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  if (!_0x3c03e0) {
    bot.sendMessage(_0x5c4133, "Mohon masukkan ID server yang ingin dihapus, contoh: /delsrv 1234");
    return;
  }
  try {
    await callPteroAPI("DELETE", "servers/" + _0x3c03e0);
    bot.sendMessage(_0x5c4133, "SERVER BERHASIL DIHAPUS");
  } catch (_0x12dfc5) {
    bot.sendMessage(_0x5c4133, "Terjadi kesalahan saat menghapus server: " + _0x12dfc5.message);
  }
});
bot.onText(/\/srvinfo (.+)/, async (_0x5946e7, _0x2efac6) => {
  const _0x2125d6 = _0x5946e7.chat.id;
  const _0x5d2d8f = _0x2efac6[0x1].trim();
  const _0x1ded0f = adminUsers.includes(String(_0x5946e7.from.id));
  if (!_0x1ded0f) {
    bot.sendMessage(_0x2125d6, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  if (!_0x5d2d8f) {
    bot.sendMessage(_0x2125d6, "Format salah. Penggunaan: /srvinfo <server_id>");
    return;
  }
  try {
    const _0x2a2599 = await callPteroAPI("GET", "servers/" + _0x5d2d8f);
    const _0x50b9ab = _0x2a2599.attributes;
    let _0x4791c5 = _0x50b9ab.status || "Unknown";
    try {
      const _0x33d12f = await callPteroAPI('GET', "servers/" + _0x50b9ab.uuid.split('-')[0x0] + "/resources", null, "client");
      _0x4791c5 = _0x33d12f.attributes.current_state;
    } catch (_0x6e5d10) {
      console.warn("Tidak dapat mendapatkan status real-time untuk server " + _0x5d2d8f + ": " + _0x6e5d10.message);
    }
    const _0x4d5717 = "\n        Detail Server:\n        🆔 ID: " + _0x50b9ab.id + "\n        🏷️ Nama: " + _0x50b9ab.name + "\n        📝 Deskripsi: " + (_0x50b9ab.description || "N/A") + "\n        👤 ID Pemilik: " + _0x50b9ab.user + "\n        📦 ID Egg: " + _0x50b9ab.egg + "\n        📍 ID Lokasi: " + _0x50b9ab.location + "\n        💾 Memori: " + (_0x50b9ab.limits.memory === 0x0 ? "Unlimited" : _0x50b9ab.limits.memory + " MB") + "\n        💽 Disk: " + (_0x50b9ab.limits.disk === 0x0 ? "Unlimited" : _0x50b9ab.limits.disk + " MB") + "\n        ⚡ CPU: " + (_0x50b9ab.limits.cpu === 0x0 ? "Unlimited" : _0x50b9ab.limits.cpu + '%') + "\n        📊 Status: " + _0x4791c5 + "\n        Dibuat Pada: " + new Date(_0x50b9ab.created_at).toLocaleString() + "\n        ";
    bot.sendMessage(_0x2125d6, _0x4d5717);
  } catch (_0x3c9103) {
    bot.sendMessage(_0x2125d6, "Gagal mendapatkan informasi server " + _0x5d2d8f + ": " + _0x3c9103.message);
  }
});
bot.onText(/\/usrinfo (.+)/, async (_0x2360b3, _0x11a724) => {
  const _0x5874ea = _0x2360b3.chat.id;
  const _0x559863 = _0x11a724[0x1].trim();
  const _0x4365f7 = adminUsers.includes(String(_0x2360b3.from.id));
  if (!_0x4365f7) {
    bot.sendMessage(_0x5874ea, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  if (!_0x559863) {
    bot.sendMessage(_0x5874ea, "Format salah. Penggunaan: /usrinfo <user_id>");
    return;
  }
  try {
    const _0x3198bb = await callPteroAPI("GET", "users/" + _0x559863);
    const _0x35d8d6 = _0x3198bb.attributes;
    const _0x2a0e80 = "\n        Detail Pengguna:\n        🆔 ID: " + _0x35d8d6.id + "\n        👤 Nama Pengguna: " + _0x35d8d6.username + "\n        📧 Email: " + _0x35d8d6.email + "\n        📛 Nama: " + _0x35d8d6.first_name + " " + _0x35d8d6.last_name + "\n        🌐 Bahasa: " + _0x35d8d6.language + "\n        👑 Admin: " + (_0x35d8d6.root_admin ? 'Ya' : "Tidak") + "\n        Batas Server: " + (_0x35d8d6.server_limit === null ? "Unlimited" : _0x35d8d6.server_limit) + "\n        Dibuat Pada: " + new Date(_0x35d8d6.created_at).toLocaleString() + "\n        ";
    bot.sendMessage(_0x5874ea, _0x2a0e80);
  } catch (_0x3c7c09) {
    bot.sendMessage(_0x5874ea, "Gagal mendapatkan informasi pengguna " + _0x559863 + ": " + _0x3c7c09.message);
  }
});
bot.onText(/\/updatesrv (.+)/, async (_0x3a7ebc, _0x15597e) => {
  const _0x3d1fbe = _0x3a7ebc.chat.id;
  const _0x1fc315 = adminUsers.includes(String(_0x3a7ebc.from.id));
  if (!_0x1fc315) {
    bot.sendMessage(_0x3d1fbe, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': 'https://t.me/kyzee4you'
        }]]
      }
    });
    return;
  }
  const _0x248b4e = _0x15597e[0x1].split(',').map(_0x3b918f => _0x3b918f.trim());
  if (_0x248b4e.length < 0x7) {
    return bot.sendMessage(_0x3d1fbe, "Format salah. Penggunaan: /updatesrv <server_id>,<memory_mb>,<disk_mb>,<cpu_percent>,<allocations>,<databases>,<backups>");
  }
  const _0x2ca5ff = _0x248b4e[0x0];
  const _0x34f142 = parseInt(_0x248b4e[0x1]);
  const _0xb2af49 = parseInt(_0x248b4e[0x2]);
  const _0x1e26b7 = parseInt(_0x248b4e[0x3]);
  const _0x58e224 = parseInt(_0x248b4e[0x4]);
  const _0x52e1b8 = parseInt(_0x248b4e[0x5]);
  const _0x555113 = parseInt(_0x248b4e[0x6]);
  if (isNaN(_0x34f142) || isNaN(_0xb2af49) || isNaN(_0x1e26b7) || isNaN(_0x58e224) || isNaN(_0x52e1b8) || isNaN(_0x555113)) {
    return bot.sendMessage(_0x3d1fbe, "Input sumber daya harus berupa angka.");
  }
  try {
    const _0x13e8ab = await callPteroAPI("GET", "servers/" + _0x2ca5ff);
    const _0x421a5d = _0x13e8ab.attributes;
    const _0x184268 = {
      'memory': _0x34f142,
      'swap': _0x421a5d.limits.swap,
      'disk': _0xb2af49,
      'io': _0x421a5d.limits.io,
      'cpu': _0x1e26b7
    };
    const _0x1ec0d3 = {
      'databases': _0x52e1b8,
      'backups': _0x555113,
      'allocations': _0x58e224
    };
    await callPteroAPI("PATCH", "servers/" + _0x2ca5ff + "/details", {
      'name': _0x421a5d.name,
      'user': _0x421a5d.user,
      'egg': _0x421a5d.egg,
      'description': _0x421a5d.description
    });
    await callPteroAPI('PATCH', "servers/" + _0x2ca5ff + "/build", {
      'memory': _0x184268.memory,
      'swap': _0x184268.swap,
      'disk': _0x184268.disk,
      'io': _0x184268.io,
      'cpu': _0x184268.cpu,
      'feature_limits': _0x1ec0d3
    });
    bot.sendMessage(_0x3d1fbe, "Sumber daya server " + _0x2ca5ff + " berhasil diperbarui.");
  } catch (_0x388cb1) {
    bot.sendMessage(_0x3d1fbe, "Gagal memperbarui sumber daya server " + _0x2ca5ff + ": " + _0x388cb1.message);
  }
});
bot.onText(/\/reinstallsrv (.+)/, async (_0x51873c, _0x355504) => {
  const _0x103c1e = _0x51873c.chat.id;
  const _0x3ef930 = adminUsers.includes(String(_0x51873c.from.id));
  if (!_0x3ef930) {
    bot.sendMessage(_0x103c1e, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  const _0x9177ca = _0x355504[0x1].trim();
  if (!_0x9177ca) {
    return bot.sendMessage(_0x103c1e, "Format salah. Penggunaan: /reinstallsrv <server_id>");
  }
  try {
    const _0x4962c7 = await callPteroAPI("GET", "servers?filter[id]=" + _0x9177ca);
    if (!_0x4962c7.data || _0x4962c7.data.length === 0x0) {
      bot.sendMessage(_0x103c1e, "Server dengan ID " + _0x9177ca + " tidak ditemukan.");
      return;
    }
    const _0x5e6cff = _0x4962c7.data[0x0].attributes.uuid.split('-')[0x0];
    await callPteroAPI('POST', "servers/" + _0x5e6cff + "/reinstall", {}, "client");
    bot.sendMessage(_0x103c1e, "Perintah instal ulang berhasil dikirim ke server " + _0x9177ca + '.');
  } catch (_0x5851fd) {
    bot.sendMessage(_0x103c1e, "Gagal menginstal ulang server " + _0x9177ca + ": " + _0x5851fd.message);
  }
});
bot.onText(/\/suspendusr (.+)/, async (_0x197b2f, _0x276d7b) => setUserSuspension(_0x197b2f, _0x276d7b[0x1], true));
bot.onText(/\/unsuspendusr (.+)/, async (_0x21ddfc, _0x121a0a) => setUserSuspension(_0x21ddfc, _0x121a0a[0x1], false));
async function setUserSuspension(_0x24d6ff, _0x3ace37, _0x1b6ed3) {
  const _0x5e6537 = _0x24d6ff.chat.id;
  const _0x57ad57 = adminUsers.includes(String(_0x24d6ff.from.id));
  if (!_0x57ad57) {
    bot.sendMessage(_0x5e6537, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': 'https://t.me/kyzee4you'
        }]]
      }
    });
    return;
  }
  if (!_0x3ace37) {
    return bot.sendMessage(_0x5e6537, "Format salah. Penggunaan: /" + (_0x1b6ed3 ? 'suspendusr' : 'unsuspendusr') + " <user_id>");
  }
  try {
    await callPteroAPI('POST', 'users/' + _0x3ace37 + "/suspend", {
      'suspended': _0x1b6ed3
    });
    bot.sendMessage(_0x5e6537, "Pengguna " + _0x3ace37 + " berhasil " + (_0x1b6ed3 ? "ditangguhkan" : "diaktifkan kembali") + '.');
  } catch (_0x5d47c0) {
    bot.sendMessage(_0x5e6537, "Gagal " + (_0x1b6ed3 ? "menangguhkan" : "mengaktifkan kembali") + " pengguna " + _0x3ace37 + ": " + _0x5d47c0.message);
  }
}
bot.onText(/\/suspendrv (.+)/, async (_0x228f56, _0x973557) => setServerSuspension(_0x228f56, _0x973557[0x1], true));
bot.onText(/\/unsuspendrv (.+)/, async (_0x13aa4c, _0x359602) => setServerSuspension(_0x13aa4c, _0x359602[0x1], false));
async function setServerSuspension(_0x1b6483, _0xb19c75, _0x32d916) {
  const _0x2780d8 = _0x1b6483.chat.id;
  const _0x69a348 = adminUsers.includes(String(_0x1b6483.from.id));
  if (!_0x69a348) {
    bot.sendMessage(_0x2780d8, "Maaf, perintah ini hanya untuk Owner. Silakan hubungi admin untuk informasi lebih lanjut.", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': 'https://t.me/kyzee4you'
        }]]
      }
    });
    return;
  }
  if (!_0xb19c75) {
    return bot.sendMessage(_0x2780d8, "Format salah. Penggunaan: /" + (_0x32d916 ? 'suspendrv' : "unsuspendrv") + " <server_id>");
  }
  try {
    await callPteroAPI("POST", "servers/" + _0xb19c75 + "/suspend", {
      'suspended': _0x32d916
    });
    bot.sendMessage(_0x2780d8, "Server " + _0xb19c75 + " berhasil " + (_0x32d916 ? "ditangguhkan" : "diaktifkan kembali") + '.');
  } catch (_0x360881) {
    bot.sendMessage(_0x2780d8, "Gagal " + (_0x32d916 ? 'menangguhkan' : "mengaktifkan kembali") + " server " + _0xb19c75 + ": " + _0x360881.message);
  }
}
bot.onText(/\/payment/, _0x322dd2 => {
  const _0x2569c2 = _0x322dd2.chat.id;
  bot.sendMessage(_0x2569c2, "┏━━━⬣\n│\n│PAYMENT\n│\n│dana\n│gopay\n│ovo\n│UNTUK PAYMENT QRIS,\n│SILAHKAN TEKAN\n│TOMBOL DI BAWAH\n┗━━━━━━━⬣", {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "QRIS GA ADA BRE:v",
        'url': "https://https://files.catbox.moe/xnye6h.jpg"
      }]]
    }
  });
});
bot.onText(/\/dana/, _0x850af0 => {
  const _0x5ca236 = _0x850af0.chat.id;
  bot.sendMessage(_0x5ca236, "DANA\n0882000181011\nA/N D\n\nSERTAKAN KIRIM PEMBUKTIAN\nTRANSFER KE OWNER,\nUNTUK MELANJUTKAN TRANSAKSI.", {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "CHANEL",
        'url': 'https://t.me/KyzeChannel'
      }, {
        'text': "OWNER",
        'url': 'https://t.me/kyzee4you'
      }]]
    }
  });
});
bot.onText(/\/gopay/, _0x1aac1f => {
  const _0x270bd0 = _0x1aac1f.chat.id;
  bot.sendMessage(_0x270bd0, "GOPAY\n0882000181011\nA/N D\n\nSERTAKAN KIRIM PEMBUKTIAN\nTRANSFER KE OWNER,\nUNTUK MELANJUTKAN TRANSAKSI.", {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "CHANEL",
        'url': "https://t.me/KyzeChannel"
      }, {
        'text': "OWNER",
        'url': "https://t.me/kyzee4you"
      }]]
    }
  });
});
bot.onText(/\/ovo/, _0x4efa0b => {
  const _0x1ac90b = _0x4efa0b.chat.id;
  bot.sendMessage(_0x1ac90b, "OVO\nTIDAK_ADA\nA/N D\n\nSERTAKAN KIRIM PEMBUKTIAN\nTRANSFER KE OWNER,\nUNTUK MELANJUTKAN TRANSAKSI.", {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "CHANEL",
        'url': "https://t.me/KyzeChannel"
      }, {
        'text': "OWNER",
        'url': "https://whatsapp.com/channel/0029Vb64TguEAKWArtGfv62r"
      }]]
    }
  });
});
bot.onText(/\/listadmin/, async _0x12869c => {
  const _0x57c023 = _0x12869c.chat.id;
  const _0x1465e7 = adminUsers.includes(String(_0x12869c.from.id));
  if (!_0x1465e7) {
    bot.sendMessage(_0x57c023, "Perintah Hanya Untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': 'https://t.me/kyzee4you'
        }]]
      }
    });
    return;
  }
  try {
    let _0x753813 = await callPteroAPI("GET", "users?page=1");
    let _0x500f48 = _0x753813.data;
    let _0xc7d350 = "Berikut daftar admin :\n\n";
    for (let _0x4a6cb8 of _0x500f48) {
      let _0x48875b = _0x4a6cb8.attributes;
      if (_0x48875b.root_admin) {
        _0xc7d350 += "🆔 ID: " + _0x48875b.id + " - 🌟 Status: " + (_0x48875b.server_limit === null ? "Unlimited Servers" : _0x48875b.server_limit + " Servers") + "\n";
        _0xc7d350 += "Nama Pengguna: " + _0x48875b.username + "\n";
        _0xc7d350 += "Nama: " + _0x48875b.first_name + " " + _0x48875b.last_name + "\n\n";
      }
    }
    _0xc7d350 += "By KYZE\n";
    _0xc7d350 += "Halaman: " + _0x753813.meta.pagination.current_page + '/' + _0x753813.meta.pagination.total_pages + "\n";
    _0xc7d350 += "Total Admin: " + _0x753813.meta.pagination.count;
    const _0x299465 = [[{
      'text': "BACK",
      'callback_data': JSON.stringify({
        'action': "back",
        'page': parseInt(_0x753813.meta.pagination.current_page) - 0x1
      })
    }, {
      'text': "NEXT",
      'callback_data': JSON.stringify({
        'action': "next",
        'page': parseInt(_0x753813.meta.pagination.current_page) + 0x1
      })
    }]];
    bot.sendMessage(_0x57c023, _0xc7d350, {
      'reply_markup': {
        'inline_keyboard': _0x299465
      }
    });
  } catch (_0x1d0bdc) {
    console.error(_0x1d0bdc);
    bot.sendMessage(_0x57c023, "Terjadi kesalahan dalam memproses permintaan: " + _0x1d0bdc.message);
  }
});
async function handleListAdminPagination(_0x172bc3, _0x2c27c8) {
  const _0x4e17ba = _0x172bc3.message.chat.id;
  const _0x3b5775 = _0x172bc3.message.message_id;
  const _0x6d3e62 = adminUsers.includes(String(_0x172bc3.from.id));
  if (!_0x6d3e62) {
    bot.sendMessage(_0x4e17ba, "Maaf, perintah ini hanya untuk Owner.");
    return;
  }
  if (_0x2c27c8 < 0x1) {
    _0x2c27c8 = 0x1;
  }
  try {
    let _0x5bff4d = await callPteroAPI("GET", "users?page=" + _0x2c27c8);
    let _0x3967e8 = _0x5bff4d.data;
    let _0x2a873f = "Berikut daftar admin :\n\n";
    for (let _0x2fa43d of _0x3967e8) {
      let _0x233b47 = _0x2fa43d.attributes;
      if (_0x233b47.root_admin) {
        _0x2a873f += "🆔 ID: " + _0x233b47.id + " - 🌟 Status: " + (_0x233b47.server_limit === null ? "Unlimited Servers" : _0x233b47.server_limit + " Servers") + "\n";
        _0x2a873f += "Nama Pengguna: " + _0x233b47.username + "\n";
        _0x2a873f += "Nama: " + _0x233b47.first_name + " " + _0x233b47.last_name + "\n\n";
      }
    }
    _0x2a873f += "By kyze\n";
    _0x2a873f += "Halaman: " + _0x5bff4d.meta.pagination.current_page + '/' + _0x5bff4d.meta.pagination.total_pages + "\n";
    _0x2a873f += "Total Admin: " + _0x5bff4d.meta.pagination.count;
    const _0x4530d2 = [[{
      'text': "BACK",
      'callback_data': JSON.stringify({
        'action': 'back',
        'page': parseInt(_0x5bff4d.meta.pagination.current_page) - 0x1
      })
    }, {
      'text': "NEXT",
      'callback_data': JSON.stringify({
        'action': "next",
        'page': parseInt(_0x5bff4d.meta.pagination.current_page) + 0x1
      })
    }]];
    bot.editMessageText(_0x2a873f, {
      'chat_id': _0x4e17ba,
      'message_id': _0x3b5775,
      'reply_markup': {
        'inline_keyboard': _0x4530d2
      },
      'parse_mode': "Markdown"
    })['catch'](_0x5cb728 => {
      console.error("Error mengedit pesan untuk paginasi:", _0x5cb728.message);
      if (_0x5cb728.message.includes("message is not modified")) {
        bot.answerCallbackQuery(_0x172bc3.id, "Tidak ada perubahan pada halaman.");
      } else {
        bot.sendMessage(_0x4e17ba, "Terjadi kesalahan saat memperbarui daftar admin.");
      }
    });
  } catch (_0x225784) {
    console.error(_0x225784);
    bot.sendMessage(_0x4e17ba, "Terjadi kesalahan dalam memproses permintaan: " + _0x225784.message);
  }
}
bot.onText(/\/delusr (.+)/, async (_0xefda27, _0x1df8e9) => {
  const _0x594436 = _0xefda27.chat.id;
  const _0xb86ea8 = _0x1df8e9[0x1].trim();
  const _0xdcadf8 = adminUsers.includes(String(_0xefda27.from.id));
  if (!_0xdcadf8) {
    bot.sendMessage(_0x594436, "ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ..", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  if (!_0xb86ea8) {
    bot.sendMessage(_0x594436, "Mohon masukkan ID user yang ingin dihapus, contoh: /delusr 1");
    return;
  }
  try {
    await callPteroAPI("DELETE", "users/" + _0xb86ea8);
    bot.sendMessage(_0x594436, "PENGGUNA BERHASIL DIHAPUS");
  } catch (_0xc66ffa) {
    bot.sendMessage(_0x594436, "Terjadi kesalahan saat menghapus pengguna: " + _0xc66ffa.message);
  }
});
bot.onText(/\/listusr/, async _0x1ae8e6 => {
  const _0x317429 = _0x1ae8e6.chat.id;
  const _0x5e93c8 = adminUsers.includes(String(_0x1ae8e6.from.id));
  if (!_0x5e93c8) {
    bot.sendMessage(_0x317429, "ᴘᴇʀɪɴᴛᴀʜ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴏᴡɴᴇʀ...", {
      'reply_markup': {
        'inline_keyboard': [[{
          'text': "HUBUNGI ADMIN",
          'url': "https://t.me/kyzee4you"
        }]]
      }
    });
    return;
  }
  try {
    let _0x1d4fd1 = await callPteroAPI("GET", "users?page=1");
    let _0x48f9f0 = _0x1d4fd1.data;
    let _0x41d1bb = "Berikut daftar pengguna aktif yang dimiliki :\n\n";
    for (let _0x15dc77 of _0x48f9f0) {
      let _0x2b28c5 = _0x15dc77.attributes;
      _0x41d1bb += "\nID Pengguna: " + _0x2b28c5.id;
      _0x41d1bb += "\nNama Pengguna: " + _0x2b28c5.username;
      _0x41d1bb += "\nEmail: " + _0x2b28c5.email + "\n";
    }
    _0x41d1bb += "\nHalaman : " + _0x1d4fd1.meta.pagination.current_page + '/' + _0x1d4fd1.meta.pagination.total_pages + "\n";
    _0x41d1bb += "Total Pengguna : " + _0x1d4fd1.meta.pagination.count;
    bot.sendMessage(_0x317429, _0x41d1bb);
  } catch (_0x5aa3d5) {
    console.error(_0x5aa3d5);
    bot.sendMessage(_0x317429, "Terjadi kesalahan dalam memproses permintaan: " + _0x5aa3d5.message);
  }
});
bot.onText(/\/installpanel1 (.+)/, async (_0x2b8006, _0x22fc4f) => {
  const _0x3f4918 = _0x2b8006.chat.id;
  const _0x159205 = _0x22fc4f[0x1];
  const _0x539216 = _0x159205.split(',');
  if (_0x539216.length < 0x5) {
    return bot.sendMessage(_0x3f4918, "𝗙𝗼𝗿𝗺𝗮𝘁 𝘀𝗮𝗹𝗮𝗵!\n𝗣𝗲𝗻�𝗴𝘂𝗻𝗮𝗮𝗻: /𝗶𝗻𝘀𝘁𝗮𝗹𝗹𝗽𝗮𝗻𝗲𝗹1 𝗶𝗽𝘃𝗽𝘀,𝗽𝗮𝘀𝘀𝘄𝗼𝗿𝗱𝘃𝗽𝘀,𝗱𝗼𝗺𝗮𝗶𝗻𝗽𝗻𝗹,𝗱𝗼𝗺𝗮𝗶𝗻𝗻𝗼𝗱𝗲,𝗿𝗮𝗺𝘃𝗽𝘀 ( ᴄᴏɴ𝘁𝗼𝗵 : 𝟾𝟶𝟶𝟶 = ʀᴀᴍ 𝟾)");
  }
  const _0xa3f28a = _0x539216[0x0];
  const _0x5d5a18 = _0x539216[0x1];
  const _0x1ae50d = _0x539216[0x2];
  const _0x49c302 = _0x539216[0x3];
  const _0x4c2f30 = _0x539216[0x4];
  const _0x5f4e50 = {
    'host': _0xa3f28a,
    'port': 0x16,
    'username': "root",
    'password': _0x5d5a18
  };
  const _0x154f58 = generateRandomPassword();
  try {
    await executeSSHCommand(_0x3f4918, _0x5f4e50, "bash <(curl -s https://pterodactyl-installer.se)", [{
      'prompt': "Input",
      'response': '0'
    }, {
      'prompt': "Input",
      'response': _0x154f58
    }, {
      'prompt': "Input",
      'response': _0x154f58
    }, {
      'prompt': "Input",
      'response': _0x154f58
    }, {
      'prompt': "Input",
      'response': "Asia/Jakarta"
    }, {
      'prompt': "Input",
      'response': "rexxaoffc@gmail.com"
    }, {
      'prompt': "Input",
      'response': "rexxaoffc@gmail.com"
    }, {
      'prompt': 'Input',
      'response': "rexxa"
    }, {
      'prompt': 'Input',
      'response': "rexxa"
    }, {
      'prompt': "Input",
      'response': "rexxa"
    }, {
      'prompt': 'Input',
      'response': _0x1ae50d
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': "yes"
    }, {
      'prompt': "Please read the Terms of Service",
      'response': 'Y'
    }, {
      'prompt': "Input",
      'response': "\n"
    }, {
      'prompt': "Input",
      'response': '1'
    }], "𝗣𝗥𝗢𝗦𝗘𝗦 𝗣𝗘𝗡𝗚𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗡 𝗣𝗔𝗡𝗘𝗟 𝗦𝗘𝗗𝗔𝗡𝗚 𝗕𝗘𝗥𝗟𝗔𝗡𝗚𝗦𝗨𝗡𝗚 𝗠𝗢𝗛𝗢𝗡 𝗧𝗨𝗡𝗚𝗚𝗨 𝟱-𝟭𝟬𝗠𝗘𝗡𝗜𝗧", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗻𝗷𝗮𝗹𝗮𝗻𝗸𝗮𝗻 𝗽𝗲𝗿𝗶𝗻𝘁𝗮𝗵 𝗶𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝗽𝗮𝗻𝗲𝗹.");
    await executeSSHCommand(_0x3f4918, _0x5f4e50, "bash <(curl -s https://pterodactyl-installer.se)", [{
      'prompt': 'Input',
      'response': '1'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': _0x1ae50d
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': _0x154f58
    }, {
      'prompt': "Input",
      'response': _0x154f58
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': _0x49c302
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': "rexxaoffc@gmail.com"
    }, {
      'prompt': "Input",
      'response': 'y'
    }], "𝗣𝗥𝗢𝗦𝗘𝗦 𝗣𝗘𝗡𝗚𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗡 𝗪𝗜𝗡𝗚𝗦 𝗦𝗘𝗗𝗔𝗡𝗚 𝗕𝗘𝗥𝗟𝗔𝗡𝗚𝗦𝗨𝗡𝗚 𝗠𝗢𝗛𝗢𝗡 𝗧𝗨𝗡𝗚𝗚𝗨 𝟱 𝗠𝗘𝗡𝗜𝗧", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗻𝗷𝗮𝗹𝗮𝗻𝗸𝗮𝗻 𝗽𝗲𝗿𝗶𝗻𝘁𝗮𝗵 𝗶𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝘄𝗶𝗻𝗴𝘀.");
    await executeSSHCommand(_0x3f4918, _0x5f4e50, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh)", [{
      'prompt': "Input",
      'response': '4'
    }, {
      'prompt': "Input",
      'response': "ReXcZ"
    }, {
      'prompt': 'Input',
      'response': "ReXcZ"
    }, {
      'prompt': "Input",
      'response': _0x49c302
    }, {
      'prompt': "Input",
      'response': 'ReXcZ'
    }, {
      'prompt': 'Input',
      'response': _0x4c2f30
    }, {
      'prompt': "Input",
      'response': _0x4c2f30
    }, {
      'prompt': "Input",
      'response': '1'
    }], "𝗠𝗘𝗠𝗨𝗟𝗔𝗜 𝗖𝗥𝗘𝗔𝗧𝗘 𝗡𝗢𝗗𝗘 & 𝗟𝗢𝗖𝗔𝗧𝗜𝗢𝗡", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗺𝗯𝘂𝗮𝘁 𝗻𝗼𝗱𝗲.");
    bot.sendMessage(_0x3f4918, "𝗗𝗔𝗧𝗔 𝗣𝗔𝗡𝗘𝗟 𝗔𝗡𝗗𝗔\n\n𝗨𝗦𝗘𝗥𝗡𝗔𝗠𝗘: rexxa\n𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: rexxa\n𝗟𝗢𝗚𝗜𝗡: " + _0x1ae50d + "\n\n𝗡𝗼𝘁𝗲: 𝗦𝗲𝗺𝘂𝗮 𝗜𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝗧𝗲𝗹𝗮𝗵 𝗦𝗲𝗹𝗲𝘀𝗮𝗶. 𝗦𝗶𝗹𝗮𝗵𝗸𝗮𝗻 𝗰𝗿𝗲𝗮𝘁𝗲 𝗮𝗹𝗹𝗼𝗰𝗮𝘁𝗶𝗼𝗻 𝗱𝗶 𝗻𝗼𝗱𝗲 𝘆𝗮𝗻𝗴 𝗱𝗶𝗯𝘂𝗮𝘁 𝗼𝗹𝗲𝗵 𝗯𝗼𝘁 𝗱𝗮𝗻 𝗮𝗺𝗯𝗶𝗹 𝘁𝗼𝗸𝗲𝗻 𝗸𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗮𝘀𝗶, 𝗹𝗮𝗹𝘂 𝗸𝗲𝘁𝗶𝗸 /𝘄𝗶𝗻𝗴𝘀 𝗶𝗽𝘃𝗽𝘀,𝗽𝘄𝘃𝗽𝘀,(𝘁𝗼𝗸𝗲𝗻). \n𝗡𝗼𝘁𝗲: 𝗛𝗮𝗿𝗮𝗽 𝘁𝘂𝗻𝗴𝗴𝘂 𝟭-𝟱 𝗺𝗲𝗻𝗶𝘁 𝗮𝗴𝗮𝗿 𝘄𝗲𝗯 𝗯𝗶𝘀𝗮 𝗱𝗶𝗮𝗸𝘀𝗲𝘀.");
  } catch (_0x202d97) {
    console.error("Instalasi gagal:", _0x202d97);
    bot.sendMessage(_0x3f4918, "Instalasi gagal: " + _0x202d97.message);
  }
});
bot.onText(/\/installpanel2 (.+)/, async (_0x2233d6, _0x22aa8f) => {
  const _0x10b1aa = _0x2233d6.chat.id;
  const _0x565183 = _0x22aa8f[0x1];
  const _0x2d74e6 = _0x565183.split(',');
  if (_0x2d74e6.length < 0x5) {
    return bot.sendMessage(_0x10b1aa, "𝗙𝗼𝗿𝗺𝗮𝘁 𝘀𝗮𝗹𝗮𝗵!\n𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻: /𝗶𝗻𝘀𝘁𝗮𝗹𝗹𝗽𝗮𝗻𝗲𝗹2 𝗶𝗽𝘃𝗽𝘀,𝗽𝗮𝘀𝘀𝘄𝗼𝗿𝗱𝘃𝗽𝘀,𝗱𝗼𝗺𝗮𝗶𝗻𝗽𝗻𝗹,𝗱𝗼𝗺𝗮𝗶𝗻𝗻𝗼𝗱𝗲,𝗿𝗮𝗺𝘃𝗽𝘀 ( ᴄᴏɴ𝘁𝗼𝗵 : 𝟾𝟶𝟶𝟶 = ʀᴀᴍ 𝟾)");
  }
  const _0x2139ee = _0x2d74e6[0x0];
  const _0x2723e9 = _0x2d74e6[0x1];
  const _0x1b9f20 = _0x2d74e6[0x2];
  const _0x479ffe = _0x2d74e6[0x3];
  const _0x211145 = _0x2d74e6[0x4];
  const _0x1ad7ae = {
    'host': _0x2139ee,
    'port': 0x16,
    'username': "root",
    'password': _0x2723e9
  };
  const _0x24e080 = generateRandomPassword();
  try {
    await executeSSHCommand(_0x10b1aa, _0x1ad7ae, "bash <(curl -s https://pterodactyl-installer.se)", [{
      'prompt': "Input",
      'response': '0'
    }, {
      'prompt': "Input",
      'response': _0x24e080
    }, {
      'prompt': 'Input',
      'response': _0x24e080
    }, {
      'prompt': "Input",
      'response': _0x24e080
    }, {
      'prompt': "Input",
      'response': "Asia/Jakarta"
    }, {
      'prompt': "Input",
      'response': "rexxaoffc@gmail.com"
    }, {
      'prompt': "Input",
      'response': 'rexxaoffc@gmail.com'
    }, {
      'prompt': "Input",
      'response': "rexxa"
    }, {
      'prompt': "Input",
      'response': "rexxa"
    }, {
      'prompt': "Input",
      'response': "rexxa"
    }, {
      'prompt': 'Input',
      'response': _0x1b9f20
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'yes'
    }, {
      'prompt': "Please read the Terms of Service",
      'response': 'A'
    }, {
      'prompt': 'Input',
      'response': "\n"
    }, {
      'prompt': "Input",
      'response': '1'
    }], "𝗣𝗥𝗢𝗦𝗘𝗦 𝗣𝗘𝗡𝗚𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗡 𝗣𝗔𝗡𝗘𝗟 𝗦𝗘𝗗𝗔𝗡𝗚 𝗕𝗘𝗥𝗟𝗔𝗡𝗚𝗦𝗨𝗡𝗚 𝗠𝗢𝗛𝗢𝗡 𝗧𝗨𝗡𝗚𝗚𝗨 𝟱-𝟭𝟬𝗠𝗘𝗡𝗜𝗧", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗻𝗷𝗮𝗹𝗮𝗻𝗸𝗮𝗻 𝗽𝗲𝗿𝗶𝗻𝘁𝗮𝗵 𝗶𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝗽𝗮𝗻𝗲𝗹.");
    await executeSSHCommand(_0x10b1aa, _0x1ad7ae, "bash <(curl -s https://pterodactyl-installer.se)", [{
      'prompt': "Input",
      'response': '1'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': _0x1b9f20
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': _0x24e080
    }, {
      'prompt': "Input",
      'response': _0x24e080
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': _0x479ffe
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': "rexxaoffc@gmail.com"
    }, {
      'prompt': "Input",
      'response': 'y'
    }], "𝗣𝗥𝗢𝗦𝗘𝗦 𝗣𝗘𝗡𝗚𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗡 𝗪𝗜𝗡𝗚𝗦 𝗦𝗘𝗗𝗔𝗡𝗚 𝗕𝗘𝗥𝗟𝗔𝗡𝗚𝗦𝗨𝗡𝗚 𝗠𝗢𝗛𝗢𝗡 𝗧𝗨𝗡𝗚𝗚𝗨 𝟱 𝗠𝗘𝗡𝗜𝗧", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗻𝗷𝗮𝗹𝗮𝗻𝗸𝗮𝗻 𝗽𝗲𝗿𝗶𝗻𝘁𝗮𝗵 𝗶𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝘄𝗶𝗻𝗴𝘀.");
    await executeSSHCommand(_0x10b1aa, _0x1ad7ae, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh)", [{
      'prompt': "Input",
      'response': '4'
    }, {
      'prompt': "Input",
      'response': "ReXcZ"
    }, {
      'prompt': "Input",
      'response': 'ReXcZ'
    }, {
      'prompt': "Input",
      'response': _0x479ffe
    }, {
      'prompt': "Input",
      'response': 'ReXcZ'
    }, {
      'prompt': "Input",
      'response': _0x211145
    }, {
      'prompt': "Input",
      'response': _0x211145
    }, {
      'prompt': 'Input',
      'response': '1'
    }], "𝗠𝗘𝗠𝗨𝗟𝗔𝗜 𝗖𝗥𝗘𝗔𝗧𝗘 𝗡𝗢𝗗𝗘 & 𝗟𝗢𝗖𝗔𝗧𝗜𝗢𝗡", "𝗧𝗲𝗿𝗷𝗮𝗱𝗶 𝗸𝗲𝘀𝗮𝗹𝗮𝗵𝗮𝗻 𝘀𝗮𝗮𝘁 𝗺𝗲𝗺𝗯𝘂𝗮𝘁 𝗻𝗼𝗱𝗲.");
    bot.sendMessage(_0x10b1aa, "𝗗𝗔𝗧𝗔 𝗣𝗔𝗡𝗘𝗟 𝗔𝗡𝗗𝗔\n\n𝗨𝗦𝗘𝗥𝗡𝗔𝗠𝗘: rexxa\n𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: rexxa\n𝗟𝗢𝗚𝗜𝗡: " + _0x1b9f20 + "\n\n𝗡𝗼𝘁𝗲: 𝗦𝗲𝗺𝘂𝗮 𝗜𝗻𝘀𝘁𝗮𝗹𝗮𝘀𝗶 𝗧𝗲𝗹𝗮𝗵 𝗦𝗲𝗹𝗲𝘀𝗮𝗶. 𝗦𝗶𝗹𝗮𝗵𝗸𝗮𝗻 𝗰𝗿𝗲𝗮𝘁𝗲 𝗮𝗹𝗹𝗼𝗰𝗮𝘁𝗶𝗼𝗻 𝗱𝗶 𝗻𝗼𝗱𝗲 𝘆𝗮𝗻𝗴 𝗱𝗶𝗯𝘂𝗮𝘁 𝗼𝗹𝗲𝗵 𝗯𝗼𝘁 𝗱𝗮𝗻 𝗮𝗺𝗯𝗶𝗹 𝘁𝗼𝗸𝗲𝗻 𝗸𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗮𝘀𝗶, 𝗹𝗮𝗹𝘂 𝗸𝗲𝘁𝗶𝗸 /𝘄𝗶𝗻𝗴𝘀 𝗶𝗽𝘃𝗽𝘀,𝗽𝘄𝘃𝗽𝘀,(𝘁𝗼𝗸𝗲𝗻). \n𝗡𝗼𝘁𝗲: 𝗛𝗮𝗿𝗮𝗽 𝘁𝘂𝗻𝗴𝗴𝘂 𝟭-𝟱 𝗺𝗲𝗻𝗶𝘁 𝗮𝗴𝗮𝗿 𝘄𝗲𝗯 𝗯𝗶𝘀𝗮 𝗱𝗶𝗮𝗸𝘀𝗲𝘀.");
  } catch (_0x5d346d) {
    console.error("Instalasi gagal:", _0x5d346d);
    bot.sendMessage(_0x10b1aa, "Instalasi gagal: " + _0x5d346d.message);
  }
});
bot.onText(/\/hackback (.+)/, async (_0x3198e4, _0x18b9af) => {
  const _0x577ebc = _0x3198e4.chat.id;
  const _0x4fe72e = _0x18b9af[0x1];
  const _0x38153c = _0x4fe72e.split(',');
  if (_0x38153c.length < 0x2) {
    return bot.sendMessage(_0x577ebc, "𝗙𝗼𝗿𝗺𝗮𝘁 𝘀𝗮𝗹𝗮𝗵!\n𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻: /hackback 𝗶𝗽𝘃𝗽𝘀,𝗽𝗮𝘀𝘀𝘄𝗼𝗿𝗱");
  }
  const _0x21d717 = _0x38153c[0x0];
  const _0x28ca6f = _0x38153c[0x1];
  const _0x4aa322 = {
    'host': _0x21d717,
    'port': 0x16,
    'username': 'root',
    'password': _0x28ca6f
  };
  try {
    await executeSSHCommand(_0x577ebc, _0x4aa322, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh)", [{
      'prompt': "Input",
      'response': '7'
    }], "PROSES HACK BACK PTERODACTYL", "Gagal melakukan hackback.");
    bot.sendMessage(_0x577ebc, "𝗗𝗔𝗧𝗔 𝗣𝗔𝗡𝗘𝗟 𝗔𝗡𝗗𝗔\n\n𝗨𝗦𝗘𝗥𝗡𝗔𝗠𝗘: lexcz\n𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: lexcz\n\n\n");
  } catch (_0x5ac116) {
    bot.sendMessage(_0x577ebc, "Gagal melakukan hackback: " + _0x5ac116.message);
  }
});
bot.onText(/\/uninstallpanel (.+)/, async (_0x406cec, _0x540e5c) => {
  const _0x5888da = _0x406cec.chat.id;
  const _0x39c11a = _0x540e5c[0x1];
  const _0x1458e3 = _0x39c11a.split(',');
  if (_0x1458e3.length < 0x2) {
    return bot.sendMessage(_0x5888da, "𝗙𝗼𝗿𝗺𝗮𝘁 𝘀𝗮𝗹𝗮𝗵!\n𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻: /𝘂𝗻𝗶𝗻𝘀𝘁𝗮𝗹𝗹𝗽𝗮𝗻𝗲𝗹 𝗶𝗽𝘃𝗽𝘀,𝗽𝗮𝘀𝘀𝘄𝗼𝗿𝗱");
  }
  const _0x38c7ad = _0x1458e3[0x0];
  const _0x2c8e13 = _0x1458e3[0x1];
  const _0x20363c = {
    'host': _0x38c7ad,
    'port': 0x16,
    'username': 'root',
    'password': _0x2c8e13
  };
  try {
    await executeSSHCommand(_0x5888da, _0x20363c, "bash <(curl -s https://pterodactyl-installer.se)", [{
      'prompt': "Input",
      'response': '6'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'y'
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': "\n"
    }, {
      'prompt': 'Input',
      'response': "\n"
    }], "PROSES UNINSTALL PTERODACTYL", "Gagal melakukan uninstall panel.");
    bot.sendMessage(_0x5888da, "𝗦𝗨𝗖𝗖𝗘𝗦 𝗨𝗡𝗜𝗡𝗦𝗧𝗔𝗟𝗟 𝗣𝗧𝗘𝗥𝗢𝗗𝗔𝗖𝗧𝗬𝗟");
  } catch (_0x285379) {
    bot.sendMessage(_0x5888da, "Gagal melakukan uninstall panel: " + _0x285379.message);
  }
});
bot.onText(/\/uninstallthema (.+)/, async (_0x157a3f, _0x1db087) => {
  const _0x344a4a = _0x157a3f.chat.id;
  const _0x440981 = _0x1db087[0x1];
  const _0x60c034 = _0x440981.split(',');
  if (_0x60c034.length < 0x2) {
    return bot.sendMessage(_0x344a4a, "Format salah!\nPenggunaan: /uninstalltheme ipvps,password");
  }
  const _0x5ccf08 = _0x60c034[0x0];
  const _0xdbd080 = _0x60c034[0x1];
  const _0xdba380 = {
    'host': _0x5ccf08,
    'port': '22',
    'username': "root",
    'password': _0xdbd080
  };
  try {
    await executeSSHCommand(_0x344a4a, _0xdba380, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/folderr/refs/heads/main/install.sh)", [{
      'prompt': 'Input',
      'response': '9'
    }, {
      'prompt': "Input",
      'response': "yes"
    }], "PROSES UNINSTALL THEME DIMULAI MOHON TUNGGU 2-5 MENIT KEDEPAN", "Gagal melakukan uninstall tema.");
    bot.sendMessage(_0x344a4a, "`SUKSES UNINSTALL THEME PANEL ANDA, SILAHKAN CEK WEB PANEL ANDA`");
  } catch (_0x36bf80) {
    bot.sendMessage(_0x344a4a, "Gagal melakukan uninstall tema: " + _0x36bf80.message);
  }
});
bot.onText(/\/wings (.+)/, async (_0x45fc3a, _0x402616) => {
  const _0x275e7d = _0x45fc3a.chat.id;
  const _0x5e9397 = _0x402616[0x1];
  const _0x718e39 = _0x5e9397.split(',');
  if (_0x718e39.length < 0x3) {
    return bot.sendMessage(_0x275e7d, "𝗙𝗼𝗿𝗺𝗮𝘁 𝘀𝗮𝗹𝗮𝗵!\n𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻: /𝘄𝗶𝗻𝗴𝘀 𝗶𝗽𝘃𝗽𝘀,𝗽𝗮𝘀𝘀𝘄𝗼𝗿𝗱,𝘁𝗼𝗸𝗲𝗻");
  }
  const _0x27d3cc = _0x718e39[0x0];
  const _0x139cd6 = _0x718e39[0x1];
  const _0x247c7d = _0x718e39[0x2];
  const _0x6f8ee9 = {
    'host': _0x27d3cc,
    'port': 0x16,
    'username': "root",
    'password': _0x139cd6
  };
  try {
    await executeSSHCommand(_0x275e7d, _0x6f8ee9, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh)", [{
      'prompt': "Input",
      'response': '3'
    }, {
      'prompt': "Input",
      'response': _0x247c7d
    }], "𝗣𝗥𝗢𝗦𝗘𝗦 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗘 𝗪𝗜𝗡𝗚𝗦", "Gagal mengkonfigurasi wings.");
    bot.sendMessage(_0x275e7d, "𝗦𝗨𝗖𝗖𝗘𝗦 𝗦𝗧𝗔𝗥𝗧 𝗪𝗜𝗡𝗚𝗦 𝗗𝗜 𝗣𝗔𝗡𝗘𝗟 𝗔𝗡𝗗𝗔 𝗖𝗢𝗕𝗔 𝗖𝗘𝗞 𝗣𝗔𝗦𝗧𝗜 𝗜𝗝𝗢");
  } catch (_0x534616) {
    bot.sendMessage(_0x275e7d, "Gagal mengkonfigurasi wings: " + _0x534616.message);
  }
});
bot.onText(/\/installdepend (.+)/, async (_0x55a089, _0x30f629) => {
  const _0x19d91c = _0x55a089.chat.id;
  const _0x445cd = _0x30f629[0x1];
  const _0x5c3ac5 = _0x445cd.split(',');
  if (_0x5c3ac5.length < 0x2) {
    return bot.sendMessage(_0x19d91c, "Format salah!\nPenggunaan: /installdepend ipvps,password");
  }
  const _0x4c7367 = _0x5c3ac5[0x0];
  const _0x5af97d = _0x5c3ac5[0x1];
  const _0x219fba = {
    'host': _0x4c7367,
    'port': '22',
    'username': "root",
    'password': _0x5af97d
  };
  try {
    await executeSSHCommand(_0x19d91c, _0x219fba, "bash <(curl https://raw.githubusercontent.com/LeXcZxMoDz9/folderr/refs/heads/main/install.sh)", [{
      'prompt': 'Input',
      'response': '11'
    }, {
      'prompt': "Input",
      'response': 'A'
    }, {
      'prompt': "Input",
      'response': 'Y'
    }, {
      'prompt': 'Input',
      'response': 'Y'
    }], "PROSES INSTALL DEPEND DIMULAI MOHON TUNGGU 1-2 MENIT KEDEPAN", "Gagal menginstal dependensi.");
    bot.sendMessage(_0x19d91c, "`SUKSES INSTALL DEPEND ADDON/NEBULA`");
  } catch (_0x457628) {
    bot.sendMessage(_0x19d91c, "Gagal menginstal dependensi: " + _0x457628.message);
  }
});
bot.onText(/\/elysium (.+)/, async (_0x5df011, _0x1cf31c) => {
  const _0xa08b6d = _0x5df011.chat.id;
  const _0x42551b = _0x1cf31c[0x1];
  const _0x14ce08 = _0x42551b.split(',');
  if (_0x14ce08.length < 0x2) {
    return bot.sendMessage(_0xa08b6d, "Format salah!\nPenggunaan: /elysium ipvps,password");
  }
  const _0x52f1fb = _0x14ce08[0x0];
  const _0xb1b1ba = _0x14ce08[0x1];
  const _0x347c57 = {
    'host': _0x52f1fb,
    'port': '22',
    'username': 'root',
    'password': _0xb1b1ba
  };
  try {
    await executeSSHCommand(_0xa08b6d, _0x347c57, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/folderr/refs/heads/main/installp.sh)", [{
      'prompt': "Input",
      'response': '1'
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': "yes"
    }], "PROSES INSTALL THEME DIMULAI MOHON TUNGGU 1-2 MENIT KEDEPAN", "Gagal menginstal tema Elysium.");
    bot.sendMessage(_0xa08b6d, "`SUKSES INSTALL THEME ELSYUM`");
  } catch (_0x1c1989) {
    bot.sendMessage(_0xa08b6d, "Gagal menginstal tema Elysium: " + _0x1c1989.message);
  }
});
bot.onText(/\/stellar (.+)/, async (_0xca761d, _0x2a884e) => {
  const _0x3523ed = _0xca761d.chat.id;
  const _0x1f878c = _0x2a884e[0x1];
  const _0x210a85 = _0x1f878c.split(',');
  if (_0x210a85.length < 0x2) {
    return bot.sendMessage(_0x3523ed, "Format salah!\nPenggunaan: /stellar ipvps,password");
  }
  const _0x9cf46 = _0x210a85[0x0];
  const _0x2b0a26 = _0x210a85[0x1];
  const _0x23dcb4 = {
    'host': _0x9cf46,
    'port': '22',
    'username': "root",
    'password': _0x2b0a26
  };
  try {
    await executeSSHCommand(_0x3523ed, _0x23dcb4, "bash <(curl -s https://raw.githubusercontent.com/LeXcZxMoDz9/Installerlex/refs/heads/main/install.sh)", [{
      'prompt': "Input",
      'response': '1'
    }, {
      'prompt': "Input",
      'response': '1'
    }, {
      'prompt': 'Input',
      'response': 'y'
    }, {
      'prompt': "Input",
      'response': 'x'
    }], "PROSES INSTALL THEME DIMULAI MOHON TUNGGU 5-10 MENIT KEDEPAN", "Gagal menginstal tema Stellar.");
    bot.sendMessage(_0x3523ed, "`SUKSES INSTALL THEME PANEL STELLAR, SILAHKAN CEK WEB PANEL ANDA`");
  } catch (_0x4bfc33) {
    bot.sendMessage(_0x3523ed, "Gagal menginstal tema Stellar: " + _0x4bfc33.message);
  }
});
bot.onText(/\/panel/, _0x404110 => {
  const _0x2c8b6c = _0x404110.chat.id;
  const _0x26b0c1 = _0x404110.from.username;
  const _0x1891dc = "*Hai @" + _0x26b0c1 + " 👋* CARA BIKIN PANEL BY KYZE\n\n𝗖𝗔𝗥𝗔 𝗔𝗗𝗗 𝗨𝗦𝗘𝗥 𝗣𝗔𝗡𝗘𝗟 :\n𝗿𝗮𝗺 NAMA,IDLU\n𝗰𝗼𝗻𝘁𝗼𝗵 : \n/𝟭𝗴𝗯 Nama,ID Tele\n/𝗮𝗱𝗽 Nama,ID Tele\n\nUNTUK ID TELE NYA BISA CEK KETIK /cekidtelegram\n\n𝗕𝘂𝘆 𝗣𝗿𝗲𝗺? 𝗕𝘂𝘆 𝗩𝗽𝘀? 𝗕𝘂𝘆 𝗔𝗱𝗺𝗶𝗻𝗣&𝗣𝘁 𝗣𝗮𝗻𝗲𝗹? 𝗕𝘂𝘆 𝗦𝗰? 𝗣𝘃 (@kyzee4you)";
  const _0x50f879 = {
    'reply_markup': {
      'inline_keyboard': [[{
        'text': "🖥️ CHANNEL WA",
        'url': 'https://whatsapp.com/channel/0029VbApKMSGk1G1H13AUg40'
      }, {
        'text': "👤 CHANNEL WA",
        'url': "https://whatsapp.com/channel/0029VbApKMSGk1G1H13AUg40"
      }], [{
        'text': "🇲🇨 CHANNEL WA",
        'url': 'https://whatsapp.com/channel/0029VbApKMSGk1G1H13AUg40'
      }]]
    }
  };
  bot.sendAnimation(_0x2c8b6c, settings.pp, {
    'caption': _0x1891dc,
    'parse_mode': "Markdown",
    'reply_markup': _0x50f879
  })['catch'](_0x181043 => {
    console.error("Error mengirim animasi untuk /panel:", _0x181043.message);
    bot.sendMessage(_0x2c8b6c, _0x1891dc, {
      'parse_mode': "Markdown",
      'reply_markup': _0x50f879
    });
  });
});
console.log("˗ˏˋ🍓ˎˊ˗ BOT SEDANGG BERLAJANN.... 💫🐾");