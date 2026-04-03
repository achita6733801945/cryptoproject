const express = require('express');
const session = require('express-session');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 FIX SESSION (ไม่เด้ง logout)
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 ชั่วโมง
    }
}));

// serve static
app.use(express.static(__dirname));


// 🔐 LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin') {
        req.session.admin = true;
        return res.json({ status: 'success' });
    }

    res.json({ status: 'error' });
});


// 🔥 CHECK LOGIN (ไม่ต้อง login ซ้ำ)
app.get('/check-login', (req, res) => {
    if (req.session.admin) {
        res.json({ status: 'ok' });
    } else {
        res.json({ status: 'no' });
    }
});


// 🚀 DEPLOY + HISTORY
app.post('/deploy', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: "fail" });
    }

    const { name, message } = req.body;

    const cmd = `git add . && git commit -m "${name}: ${message}" && git push origin main`;

    exec(cmd, (error, stdout) => {

        const log = {
            name,
            message,
            time: new Date().toLocaleString(),
            status: error ? "fail" : "success"
        };

        let history = [];

        try {
            if (fs.existsSync('history.json')) {
                const file = fs.readFileSync('history.json', 'utf8');
                history = file ? JSON.parse(file) : [];
            }
        } catch {
            history = [];
        }

        history.unshift(log);
        fs.writeFileSync('history.json', JSON.stringify(history, null, 2));

        if (error) {
            return res.json({ status: "fail", data: error.message });
        }

        res.json({ status: "success", data: stdout });
    });
});


// 📜 HISTORY
app.get('/history', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json([]);
    }

    try {
        if (!fs.existsSync('history.json')) return res.json([]);

        const file = fs.readFileSync('history.json', 'utf8');
        if (!file) return res.json([]);

        res.json(JSON.parse(file));

    } catch {
        res.json([]);
    }
});


// 📂 VERSION LIST
app.get('/commits', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json([]);
    }

    exec('git log --pretty=format:"%h|%an|%s|%cd"', (err, stdout) => {

        if (err || !stdout) return res.json([]);

        const commits = stdout.split('\n').map(line => {
            const [hash, author, message, date] = line.split('|');
            return { hash, author, message, date };
        });

        res.json(commits);
    });
});


// ⏪ ROLLBACK + DEPLOY (🔥 ตัวสำคัญ)
app.post('/rollback', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: 'fail' });
    }

    const { hash } = req.body;

    if (!hash) {
        return res.json({ status: 'fail', data: 'no hash' });
    }

  const cmd = `
git branch backup-${Date.now()} &&
git reset --hard ${hash} &&
git commit --allow-empty -m "force rebuild ${Date.now()}" &&
git push origin main --force
`;
    exec(cmd, (err, stdout) => {

        if (err) {
            return res.json({
                status: 'fail',
                data: err.message
            });
        }

        res.json({
            status: 'success',
            data: "rollback + deploy สำเร็จ"
        });
    });
});


app.listen(3000, () => console.log("🚀 Server running http://localhost:3000/admin.html"));