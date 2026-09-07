const config = require('./config');
const commands = require('./commands');
const chalk = require('chalk');

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

        if (isRented && text) {
            const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
            const shortSender = sender.split('@')[0];
            const shortGroup = from.split('@')[0].slice(0, 15) + '...'; 
            
            console.log(
                chalk.bgWhite.black(` ${time} `) + 
                chalk.bgBlue.white(` GC: ${shortGroup} `) + 
                chalk.cyan(` [${shortSender}] `) + 
                chalk.white(`» ${text}`)
            );
        }
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
