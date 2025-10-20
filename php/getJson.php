<?php
header('Content-Type: application/json');

if (!isset($_GET['file'])) {
    echo json_encode(['error' => 'no_file_specified']);
    exit;
}

$filename = basename($_GET['file']); // sanitize
$filepath = __DIR__ . '/../json/' . $filename;

if (!file_exists($filepath)) {
    echo json_encode(['error' => 'file_not_found']);
    exit;
}

echo file_get_contents($filepath);

?>