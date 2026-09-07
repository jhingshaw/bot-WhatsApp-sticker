const config = require('./config');
const commands = require('./commands');

const cooldowns = new Map();

module.exports = async (sock, msg) => {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const isOwner = sender === config.ownerNumber;
    
    const messageType = Object.keys(msg.message)[0];
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || '';

    if (!isGroup) {
        if (!isOwner) return; 
    } else {
        const isRented = config.checkRental(from);
        if (!isRented && !isOwner) return;
    }

    if (!text.startsWith(config.prefix)) return;

    if (!isOwner) {
        const now = Date.now();
        if (cooldowns.has(sender)) {
            const lastTime = cooldowns.get(sender);
            if (now - lastTime < 3000) return;
        }
        cooldowns.set(sender, now);
    }

    const args = text.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const ctx = {
        sock, msg, from, sender, isGroup, isOwner, args, messageType
    };

    await commands(command, ctx);
};
