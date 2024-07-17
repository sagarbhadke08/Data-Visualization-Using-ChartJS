<?php
include 'db.php';

$sql = "SELECT * FROM report_templates WHERE view_on_dashboard = 1";
$result = $conn->query($sql);

$templates = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $templates[] = $row;
    }
}

echo json_encode($templates);

$conn->close();
?>