const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로는 프로젝트 루트의 'briefings.db' (없으면 자동 생성)
const dbPath = path.resolve(process.cwd(), 'briefings.db');
const db = new Database(dbPath);

// 테이블 초기화
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_briefings (
    date TEXT PRIMARY KEY,
    data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 데이터 저장 (Insert or Replace)
function saveBriefing(date, jsonObj) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO daily_briefings (date, data)
    VALUES (?, ?)
  `);
    stmt.run(date, JSON.stringify(jsonObj));
    console.log(`💾 DB Saved: ${date}`);
}

// 날짜로 조회
function getBriefing(date) {
    const stmt = db.prepare('SELECT data FROM daily_briefings WHERE date = ?');
    const row = stmt.get(date);
    return row ? JSON.parse(row.data) : null;
}

// 최신 브리핑 조회
function getLatestBriefing() {
    const stmt = db.prepare('SELECT data FROM daily_briefings ORDER BY date DESC LIMIT 1');
    const row = stmt.get();
    return row ? JSON.parse(row.data) : null;
}

// 모든 날짜 목록 조회 (히스토리용)
function getAllDates() {
    const stmt = db.prepare('SELECT date FROM daily_briefings ORDER BY date DESC');
    return stmt.all().map(row => row.date);
}

module.exports = {
    db,
    saveBriefing,
    getBriefing,
    getLatestBriefing,
    getAllDates
};
