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

// 🚀 DEPLOY
app.post('/deploy', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: 'error' });
    }

    const { name, message } = req.body;

    const projectPath = "C:/xampp/htdocs/sys ad";
    const commitMsg = `${name}: ${message}`;

    exec(`cd "${projectPath}" && git add . && git commit -m "${commitMsg}" && git push origin main`,
        (error, stdout, stderr) => {

            const log = {
                name,
                message,
                time: new Date().toLocaleString(),
                status: error ? "fail" : "success"
            };

            let history = [];

            if (fs.existsSync('history.json')) {
                history = JSON.parse(fs.readFileSync('history.json'));
            }

            history.unshift(log);
            fs.writeFileSync('history.json', JSON.stringify(history, null, 2));

            if (error) {
                return res.json({ status: 'error', data: stderr });
            }

            res.json({ status: 'success', data: stdout });
        }
    );
});

// 📜 HISTORY
app.get('/history', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json([]);
    }

    if (!fs.existsSync('history.json')) {
        return res.json([]);
    }

    const data = JSON.parse(fs.readFileSync('history.json'));
    res.json(data);
});

app.listen(3000, () => console.log("Server running http://localhost:3000/admin.html"));