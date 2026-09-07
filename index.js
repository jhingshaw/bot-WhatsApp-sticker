const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const handler = require('./handler');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

function showBanner() {
    console.clear();
    console.log(chalk.cyan(`
      ██╗██╗  ██╗██╗███╗   ██╗ ██████╗ ███████╗██╗  ██╗ █████╗ ██╗    ██╗
      ██║██║  ██║██║████╗  ██║██╔════╝ ██╔════╝██║  ██║██╔══██╗██║    ██║
      ██║███████║██║██╔██╗ ██║██║  ███╗███████╗███████║███████║██║ █╗ ██║
 ██   ██║██╔══██║██║██║╚██╗██║██║   ██║╚════██║██╔══██║██╔══██║██║███╗██║
 ╚█████╔╝██║  ██║██║██║ ╚████║╚██████╔╝███████║██║  ██║██║  ██║╚███╔███╔╝
  ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ 
    `));
    console.log(chalk.greenBright('                GitHub : https://github.com/jhingshaw\n'));
    console.log(chalk.yellow('              [ System Online & Ready to Receive ]\n'));
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    let useQR = false;

    if (!state.creds.registered) {
        console.clear();
        console.log(chalk.bgBlue.white.bold('\n === AUTHENTICATION SETUP === \n'));
        console.log(chalk.cyan('1. Gunakan QR Code'));
        console.log(chalk.cyan('2. Gunakan Pairing Code'));
        const choice = await question(chalk.yellow('\nPilih metode (1/2): '));
        
        if (choice.trim() === '1') {
            useQR = true;
            console.log(chalk.green('\n[!] Silakan scan QR Code yang muncul...'));
        }
    } else {
        showBanner();
    }
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered && !useQR) {
        const phoneNumber = await question(chalk.yellow('\nMasukkan nomor WhatsApp bot (contoh: 628123456789): '));
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(chalk.bgGreen.black(`\n [!] PAIRING CODE ANDA: ${code} \n`));
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
    
        if (qr && useQR) {
            console.clear();
            console.log(chalk.yellow('\n[!] Scan QR Code di bawah ini menggunakan WhatsApp Anda:\n'));
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red(`[!] Koneksi terputus. Reconnect: ${shouldReconnect}`));
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            if (!state.creds.registered || useQR) {
                showBanner();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (msgUpdate) => {
        try {
            const msg = msgUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            await handler(sock, msg);
        } catch (err) {
            console.error(chalk.red('Error in message pipeline:'), err);
        }
    });
}

startBot();
