<?php
// GitHub Repo Info
$owner = "achita6733801945";
$repo = "cryptoproject";

// รับชื่อ deploy จาก query param
$deployName = $_GET['name'] ?? "Unnamed Deploy";

// ดึง token จาก environment ของ server
$token = getenv('DEPLOY_TOKEN');
if (!$token) die("Error: DEPLOY_TOKEN environment variable not set");

// Trigger workflow ผ่าน GitHub API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.github.com/repos/$owner/$repo/dispatches");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "event_type" => "deploy",
    "client_payload" => ["deploy_name" => $deployName]
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: application/vnd.github+json",
    "Authorization: token $token",
    "User-Agent: Admin-Deploy"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo "Deploy triggered! Name: $deployName\n";
echo $result;
?>