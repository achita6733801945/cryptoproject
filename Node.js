const express = require('express');
const { exec } = require('child_process');
const app = express();

// หน้าเว็บ admin
app.get('/admin', (req, res) => {
    res.send(`
        <h1>Admin Dashboard</h1>
        <button onclick="fetch('/deploy').then(r=>r.text()).then(alert)">Deploy Latest</button>
    `);
});

// ปุ่ม deploy
app.get('/deploy', (req, res) => {
    exec('cd /var/www/your_project && git fetch origin main && git reset --hard origin/main', (err, stdout, stderr) => {
        if (err) return res.send(`Error: ${stderr}`);
        res.send(`Deploy Done!\n${stdout}`);
    });
});

app.listen(3000, () => console.log('Admin dashboard running on http://localhost:3000/admin.html'));