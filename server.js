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


// 🚀 DEPLOY + บันทึก history
app.post('/deploy', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json({ status: "fail" });
    }

    const { name, message } = req.body;

    const cmd = `git add . && git commit -m "${name}: ${message}" && git push origin main`;

    exec(cmd, (error, stdout, stderr) => {

        // 📜 เตรียม log
        const log = {
            name: name,
            message: message,
            time: new Date().toLocaleString(),
            status: error ? "fail" : "success"
        };

        // 📂 อ่าน history เดิม
        let history = [];

        try {
            if (fs.existsSync('history.json')) {
                const file = fs.readFileSync('history.json', 'utf8');

                // 🔥 ป้องกันไฟล์ว่าง
                history = file ? JSON.parse(file) : [];
            }
        } catch (e) {
            console.log("history.json พัง → reset ใหม่");
            history = [];
        }

        // ➕ เพิ่ม log ใหม่
        history.unshift(log);

        // 💾 บันทึกกลับ
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


// 📜 HISTORY (กันพัง)
app.get('/history', (req, res) => {

    if (!req.session.admin) {
        return res.status(403).json([]);
    }

    try {
        if (!fs.existsSync('history.json')) {
            return res.json([]);
        }

        const file = fs.readFileSync('history.json', 'utf8');

        if (!file) return res.json([]);

        const data = JSON.parse(file);

        res.json(data);

    } catch (err) {
        console.log("อ่าน history ไม่ได้:", err);
        res.json([]);
    }
});


app.listen(3000, () => console.log("Server running http://localhost:3000/admin.html"));