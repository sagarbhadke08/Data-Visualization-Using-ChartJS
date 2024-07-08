<?php
include 'db.php';

$sql = "SHOW TABLES";
$result = $conn->query($sql);

$tables = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_row()) {
        $tables[] = $row[0];
    }
}

echo json_encode($tables);