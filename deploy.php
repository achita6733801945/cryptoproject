<?php
session_start();

// รหัสผ่าน admin (เปลี่ยนตามต้องการ)
$admin_password = "1234";
if(!isset($_SESSION['admin'])){
    if($_GET['password'] ?? '' !== $admin_password){
        die("กรุณาใส่รหัสผ่าน admin ?password=รหัสผ่าน"); 
    }
    $_SESSION['admin'] = true;
}

// GitHub Repo Info
$owner = "achita6733801945";
$repo = "cryptoproject";
$branch = "gh-pages"; // หรือ main ถ้า deploy ผ่าน main

// ใส่ token ของคุณที่ server เท่านั้น
$token = "YOUR_PERSONAL_ACCESS_TOKEN"; // ใส่ token ใน server เท่านั้น
// Trigger GitHub workflow ผ่าน repository_dispatch
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.github.com/repos/$owner/$repo/dispatches");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "event_type" => "deploy"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: application/vnd.github+json",
    "Authorization: token $token",
    "User-Agent: Admin-Deploy"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo "Deploy triggered!\n";
echo $result;
?>