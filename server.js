const express = require('express');
const session = require('express-session');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

// serve admin.html
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


// 🚀 DEPLOY + SAVE HISTORY
app.post('/deploy', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: "fail" });
    }

    const { name, message } = req.body;

    const cmd = `git add . && git commit -m "${name}: ${message}" && git push origin main`;

    exec(cmd, (error, stdout, stderr) => {

        const log = {
            name: name,
            message: message,
            time: new Date().toLocaleString(),
            status: error ? "fail" : "success"
        };

        let history = [];

        try {
            if (fs.existsSync('history.json')) {
                const file = fs.readFileSync('history.json', 'utf8');
                history = file ? JSON.parse(file) : [];
            }
        } catch (e) {
            console.log("history.json พัง → reset");
            history = [];
        }

        history.unshift(log);

        fs.writeFileSync('history.json', JSON.stringify(history, null, 2));

        if (error) {
            return res.json({
                status: "fail",
                data: error.message
            });
        }

        res.json({
            status: "success",
            data: stdout
        });
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

        const data = JSON.parse(file);
        res.json(data);

    } catch (err) {
        console.log("อ่าน history ไม่ได้:", err);
        res.json([]);
    }
});


// 📂 GET COMMITS (VERSION LIST)
app.get('/commits', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json([]);
    }

    exec('git log --pretty=format:"%h|%an|%s|%cd"', (err, stdout) => {

        if (err) {
            return res.json([]);
        }

        const commits = stdout.split('\n').map(line => {
            const [hash, author, message, date] = line.split('|');
            return { hash, author, message, date };
        });

        res.json(commits);
    });
});


// ⏪ ROLLBACK VERSION
app.post('/rollback', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: 'fail' });
    }

    const { hash } = req.body;

    exec(`git reset --hard ${hash} && git push origin main --force`,
        (err, stdout, stderr) => {

            if (err) {
                return res.json({
                    status: 'fail',
                    data: err.message
                });
            }

            res.json({ status: 'success' });
        }
    );
});


// 🌐 START SERVER
app.listen(3000, () => {
    console.log("🚀 Server running: http://localhost:3000/admin.html");
});