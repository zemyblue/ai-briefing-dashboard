const { saveBriefing } = require('../src/lib/db');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data/briefing.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

// DB에 저장
saveBriefing(data.date, data);

console.log(`✅ 초기 데이터 DB 저장 완료: ${data.date}`);
