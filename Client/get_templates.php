<?php
include 'db.php';

$sql = "SELECT id, name FROM report_templates ORDER BY created_at DESC";
$result = $conn->query($sql);

$templates = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $templates[] = $row;
    }
}

echo json_encode($templates);

$conn->close();