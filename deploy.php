<?php
session_start();

// 🔐 เช็ค admin
if(!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin'){
    die("Access Denied");
}

// path โปรเจ็ค
$path = "C:/xampp/htdocs/sys ad";

// run git
$output = [];

exec("cd \"$path\" && git add . 2>&1", $output);
exec("cd \"$path\" && git commit -m \"auto deploy\" 2>&1", $output);
exec("cd \"$path\" && git push origin main 2>&1", $output);

echo "<pre>";
print_r($output);
echo "</pre>";
?>