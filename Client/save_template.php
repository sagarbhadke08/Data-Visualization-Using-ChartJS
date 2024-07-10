<?php
include 'db.php';

$name = $_POST['name'];
$table = $_POST['table'];
$fields = $_POST['fields'];

$stmt = $conn->prepare("INSERT INTO report_templates (name, table_name, fields) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $table, $fields);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $conn->error]);
}

$stmt->close();
$conn->close();