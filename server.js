const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 托管 public 文件夹里的前端代码
app.use(express.static(path.join(__dirname, 'public')));

// 连接本地 SQLite 数据库
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('数据库连接失败:', err.message);
    else console.log('已连接到了本地数据库YY');
});

// 初始化数据库表
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        artist TEXT,
        cover TEXT,
        tag TEXT,
        message TEXT,
        likes INTEGER DEFAULT 0,
        recommender TEXT
    )`);
});

// 获取所有歌曲接口
app.get('/api/songs', (req, res) => {
    db.all(`SELECT * FROM songs ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 提交新歌曲接口
app.post('/api/songs', (req, res) => {
    const { title, artist, cover, tag, message, recommender } = req.body;
    db.run(`INSERT INTO songs (title, artist, cover, tag, message, recommender) VALUES (?, ?, ?, ?, ?, ?)`,
        [title, artist, cover, tag, message, recommender], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            // 返回这首歌在数据库中生成的专属 ID，便于前端做高亮特效
            res.json({ message: '推荐成功', songId: this.lastID });
        });
});

// 新增：点赞接口
app.post('/api/songs/:id/like', (req, res) => {
    const songId = req.params.id;
    db.run(`UPDATE songs SET likes = likes + 1 WHERE id = ?`, [songId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '点赞成功' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`更改已上传到网站: http://localhost:${PORT}`);
});