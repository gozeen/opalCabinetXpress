<?php
header('Content-Type: application/json');

$folder = __DIR__ . '/../json'; // adjust path

if (!is_dir($folder)) {
    echo json_encode(['error' => 'folder_not_found']);
    exit;
}

$files = [];
foreach (scandir($folder) as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
        $files[] = $file;
    }
}

echo json_encode($files);
