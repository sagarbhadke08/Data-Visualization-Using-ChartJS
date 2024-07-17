<?php
include 'db.php';

$name = $_POST['name'];
$table = $_POST['table'];
$fields = json_decode($_POST['fields']);
$viewOnDashboard = isset($_POST['view_on_dashboard']) ? 1 : 0;

// Filter out any non-field values (like 'on')
$fields = array_filter($fields, function($field) {
    return $field !== 'on';
});

$fieldsJson = json_encode($fields);

$stmt = $conn->prepare("INSERT INTO report_templates (name, table_name, fields, view_on_dashboard) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sssi", $name, $table, $fieldsJson, $viewOnDashboard);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>