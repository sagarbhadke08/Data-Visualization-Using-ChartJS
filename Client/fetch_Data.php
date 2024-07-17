<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '0');

include 'db.php';

try {
    if (!isset($_GET['table']) || !isset($_GET['fields'])) {
        throw new Exception('Missing table or fields parameter');
    }

    $table = $_GET['table'];
    $fields = explode(',', $_GET['fields']);

    // Sanitize the table name and fields to prevent SQL injection
    $table = mysqli_real_escape_string($conn, trim($table));
    $fields = array_map(function($field) use ($conn) {
        $field = trim($field);
        // Remove or replace 'on' field
        return $field !== 'on' ? mysqli_real_escape_string($conn, $field) : null;
    }, $fields);

    // Remove null values (former 'on' fields)
    $fields = array_filter($fields);

    if (empty($fields)) {
        throw new Exception('No valid fields selected');
    }

    $fieldsString = implode(', ', $fields);

    $sql = "SELECT $fieldsString FROM `$table`";
    $result = $conn->query($sql);

    if ($result === false) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $data = array();

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }

    echo json_encode($data);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}