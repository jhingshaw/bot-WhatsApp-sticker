const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const webpmux = require('node-webpmux');
const config = require('./config');

async function downloadMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function writeExif(webpBuffer, packname, author) {
    const img = new webpmux.Image();
    await img.load(webpBuffer);
    const exifStr = JSON.stringify({
        "sticker-pack-id": "wa-bot-v2",
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": ["🤖"]
    });
    const exifBuffer = Buffer.from(
        [0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]
    );
    const jsonBuffer = Buffer.from(exifStr, "utf-8");
    const exif = Buffer.concat([exifBuffer, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
}

module.exports = async (command, ctx) => {
    const { sock, msg, from, sender, isGroup, isOwner, args, messageType } = ctx;
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    switch (command) {
        case 'akses':
            if (!isOwner) return;
            if (!isGroup) return reply('Command ini hanya bisa digunakan di dalam grup.');
            if (!args[0] || isNaN(args[0])) return reply('Format: .akses <jumlah_hari>');
            
            const days = parseInt(args[0]);
            const newExpire = config.addRental(from, days);
            const dateStr = new Date(newExpire).toLocaleDateString('id-ID', { dateStyle: 'full' });
            reply(`✅ Akses grup berhasil ditambah!\n\nAktif selama: ${days} hari\nBerakhir pada: ${dateStr}`);
            break;

        case 's':
        case 'sticker':
            const isQuotedImage = messageType === 'extendedTextMessage' && msg.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
            const isImage = messageType === 'imageMessage';
            
            if (!isImage && !isQuotedImage) return reply('Kirim atau balas gambar dengan caption .s');
            
            const targetMessage = isQuotedImage ? msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : msg.message.imageMessage;
            
            try {
                const mediaBuffer = await downloadMedia(targetMessage, 'image');
                const tempIn = path.join(__dirname, `${sender}.jpg`);
                const tempOut = path.join(__dirname, `${sender}.webp`);
                
                fs.writeFileSync(tempIn, mediaBuffer);
                
                ffmpeg(tempIn)
                    .on('end', async () => {
                        const rawWebp = fs.readFileSync(tempOut);
                        const finalSticker = await writeExif(rawWebp, "Utaa", "Utaa");
                        await sock.sendMessage(from, { sticker: finalSticker }, { quoted: msg });
                        
                        fs.unlinkSync(tempIn);
                        fs.unlinkSync(tempOut);
                    })
                    .on('error', (err) => {
                        reply('Gagal membuat stiker.');
                        if(fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
                    })
                    .addOutputOptions([
                        '-vcodec', 'libwebp',
                        '-vf', "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000",
                        '-loop', '0',
                        '-preset', 'default',
                        '-an', '-vsync', '0'
                    ])
                    .save(tempOut);
            } catch (err) {
                reply('Terjadi kesalahan saat mengunduh gambar.');
            }
            break;

        case 'kick':
        case 'promote':
        case 'demote':
            if (!isGroup) return;
            const groupMeta = await sock.groupMetadata(from);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdmin = groupMeta.participants.find(p => p.id === botId)?.admin;
            if (!botIsAdmin) return reply('Bot membutuhkan akses Admin untuk melakukan ini.');
            
            const senderIsAdmin = groupMeta.participants.find(p => p.id === sender)?.admin;
            if (!senderIsAdmin && !isOwner) return reply('Anda bukan admin grup.');

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentioned.length === 0) return reply('Tag user yang ingin dieksekusi.');
            
            const actionMap = { kick: 'remove', promote: 'promote', demote: 'demote' };
            await sock.groupParticipantsUpdate(from, mentioned, actionMap[command]);
            reply(`✅ Berhasil mengeksekusi ${mentioned.length} user.`);
            break;

        case 'group':
            if (!isGroup) return;
            const gMeta = await sock.groupMetadata(from);
            const isBotAdmin = gMeta.participants.find(p => p.id === (sock.user.id.split(':')[0] + '@s.whatsapp.net'))?.admin;
            const isSenderAdmin = gMeta.participants.find(p => p.id === sender)?.admin;
            
            if (!isBotAdmin) return reply('Bot bukan admin.');
            if (!isSenderAdmin && !isOwner) return reply('Anda bukan admin grup.');

            const setting = args[0] === 'close' ? 'announcement' : args[0] === 'open' ? 'not_announcement' : null;
            if (!setting) return reply('Format: .group open / .group close');
            
            await sock.groupSettingUpdate(from, setting);
            reply(`Grup berhasil di${args[0] === 'open' ? 'buka' : 'tutup'}.`);
            break;

        case 'hidetag':
            if (!isGroup) return;
            const meta = await sock.groupMetadata(from);
            const senderAdmin = meta.participants.find(p => p.id === sender)?.admin;
            if (!senderAdmin && !isOwner) return reply('Anda bukan admin grup.');

            const textToHide = args.join(' ') || '';
            const membersId = meta.participants.map(p => p.id);
            await sock.sendMessage(from, { text: textToHide, mentions: membersId });
            break;

        case 'ping':
            reply(`PONG! 🏓\nBot berjalan lancar.`);
            break;

        case 'menu':
            const time = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
            const date = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
            
            const menu = `
┏━━━━ ❲ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢 ❳ ━━━━
┃ ⎔ 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲 : Boilerplate V2
┃ ⎔ 𝗢𝘄𝗻𝗲𝗿    : TheRaa
┃ ⎔ 𝗦𝘁𝗮𝘁𝘂𝘀   : 𝗔𝗰𝘁𝗶𝘃𝗲 🟢
┃ ⎔ 𝗧𝗶𝗺𝗲     : ${time} WIB
┃ ⎔ 𝗗𝗮𝘁𝗲     : ${date}
┗━━━━━━━━━━━━━━━━━━━━━━━

┏━━━ ❲ 𝗔𝗗𝗠𝗜𝗡 𝗣𝗔𝗡𝗘𝗟 ❳ ━━━━
┃ ◈ .group <open/close>
┃ ◈ .kick <@user>
┃ ◈ .promote <@user>
┃ ◈ .demote <@user>
┃ ◈ .hidetag <pesan>
┗━━━━━━━━━━━━━━━━━━━━━━━

┏━━━ ❲ 𝗧𝗢𝗢𝗟𝗦 ❳ ━━━━━━━━━━
┃ ◈ .s / .sticker
┃ ◈ .ping
┗━━━━━━━━━━━━━━━━━━━━━━━

┏━━━ ❲ 𝗢𝗪𝗡𝗘𝗥 𝗢𝗡𝗟𝗬 ❳ ━━━━━
┃ ◈ .akses <jumlah_hari>
┗━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
            reply(menu);
            break;
    }
};
