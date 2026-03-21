<?php
$owner = "achita6733801945";
$repo = "cryptoproject";
$branch = "main"; // branch หลัก
$deployName = $_GET['name'] ?? "Unnamed Deploy";

// ดึง GitHub token จาก environment
$token = getenv('DEPLOY_TOKEN');
if (!$token) die("Error: DEPLOY_TOKEN environment variable not set");

// 1️⃣ ทำ git add/commit/push
$dir = __DIR__; // โฟลเดอร์เว็บ
chdir($dir);

// เพิ่มไฟล์ทั้งหมด
exec("git add .", $outAdd, $errAdd);

// Commit
exec("git commit -m 'Deploy: $deployName'", $outCommit, $errCommit);

// Push
exec("git push https://$token@github.com/$owner/$repo.git $branch", $outPush, $errPush);

// 2️⃣ Trigger GitHub workflow
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

// แสดงผล
echo "Deploy triggered! Name: $deployName\n";
echo "Git push output:\n" . implode("\n", $outAdd) . "\n";
echo implode("\n", $outCommit) . "\n";
echo implode("\n", $outPush) . "\n";
echo "\nWorkflow result:\n" . $result;
?>