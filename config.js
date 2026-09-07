const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ groups: {} }));
}

module.exports = {
    ownerNumber: '628123456789@s.whatsapp.net', 
    prefix: '.',
    
    readDB: () => JSON.parse(fs.readFileSync(dbPath, 'utf-8')),
    writeDB: (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)),
    
    addRental: (groupId, days) => {
        const db = module.exports.readDB();
        const now = Date.now();
        if (!db.groups) db.groups = {};
        
        const currentExpire = db.groups[groupId]?.expire || now;
        const baseTime = currentExpire < now ? now : currentExpire;
        const newExpire = baseTime + (days * 24 * 60 * 60 * 1000);
        
        db.groups[groupId] = { expire: newExpire };
        module.exports.writeDB(db);
        return newExpire;
    },
    
    checkRental: (groupId) => {
        const db = module.exports.readDB();
        if (!db.groups || !db.groups[groupId]) return false;
        return db.groups[groupId].expire > Date.now();
    }
};
