<?php
include 'db.php';

$id = $_GET['id'];

$stmt = $conn->prepare("SELECT * FROM report_templates WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$template = $result->fetch_assoc();

echo json_encode($template);

$stmt->close();
$conn->close();