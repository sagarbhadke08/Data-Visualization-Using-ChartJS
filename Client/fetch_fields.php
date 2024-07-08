<?php
//include 'db.php';

// $table = $_GET['table'];

// switch ($table) {
//     case 'Employee':
//         $sql = "DESCRIBE Employee";
//         break;
//     case 'Client':
//         $sql = "DESCRIBE Client";
//         break;

//     default:
//         echo json_encode([]);
//         exit();
// }

// $result = $conn->query($sql);

// $fields = array();

// if ($result->num_rows > 0) {
//     while ($row = $result->fetch_assoc()) {
//         $fields[] = $row['Field'];
//     }
// }

// echo json_encode($fields);

include 'db.php';

$table = $_GET['table'];

// Sanitize the table name to prevent SQL injection
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
