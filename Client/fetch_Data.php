<?php
include 'db.php';

$table = $_GET['table'];
$fields = isset($_GET['fields']) ? explode(',', $_GET['fields']) : [];

if (empty($fields)) {
    echo json_encode([]);
    exit();
}

$allowedTables = ['Employee', 'Client'];
if (!in_array($table, $allowedTables)) {
    echo json_encode([]);
    exit();
}

$escapedFields = array_map(function ($field) use ($conn) {
    return $conn->real_escape_string($field);
}, $fields);

$sql = "SELECT " . implode(', ', $escapedFields) . " FROM $table";

$result = $conn->query($sql);

$data = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

echo json_encode($data);
