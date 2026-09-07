const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const handler = require('./handler');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Masukkan nomor WhatsApp bot (contoh: 628123456789): ');
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`[!] PAIRING CODE ANDA: ${code}`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[!] Koneksi terputus. Reconnect: ${shouldReconnect}`);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('[+] Bot berhasil terhubung ke WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (msgUpdate) => {
        try {
            const msg = msgUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            await handler(sock, msg);
        } catch (err) {
            console.error('Error in message pipeline:', err);
        }
    });
}

startBot();
