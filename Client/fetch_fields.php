<?php


include 'db.php';

$table = $_GET['table'];

$table = $conn->real_escape_string($table);

$sql = "DESCRIBE `$table`";
$result = $conn->query($sql);

$fields = array();

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $fields[] = $row['Field'];
    }
}

echo json_encode($fields);