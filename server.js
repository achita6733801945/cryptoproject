const express = require('express');
const { exec } = require('child_process');
const session = require('express-session');
const path = require('path');

const app = express();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔥 สำคัญ: serve ไฟล์ html
app.use(express.static(__dirname));

// session
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

// หน้าแรก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// LOGIN
app.post('/login', (req, res) => {
    const { user, pass } = req.body;

    if (user === 'admin' && pass === '1234') {
        req.session.admin = true;
        return res.send({ status: 'ok' });
    }
    res.send({ status: 'fail' });
});

// DEPLOY
app.post('/deploy', (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send("Forbidden");
    }

    const projectPath = "C:/xampp/htdocs/sys ad";

    exec(`cd "${projectPath}" && git add . && git commit -m "auto deploy" && git push origin main`,
        (error, stdout, stderr) => {
            if (error) {
                return res.send({ status: 'error', data: stderr });
            }
            res.send({ status: 'success', data: stdout });
        }
    );
});

app.listen(3000, () => {
    console.log("✅ Server running: http://localhost:3000");
});