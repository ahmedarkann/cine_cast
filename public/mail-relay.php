<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$SECRET = getenv('MAIL_RELAY_SECRET') ?: 'cinecast_mail_secret_2024';

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || ($body['secret'] ?? '') !== $SECRET) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$to = $body['to'] ?? '';
$subject = $body['subject'] ?? '';
$html = $body['html'] ?? '';

if (!$to || !$subject || !$html) {
    echo json_encode(['status' => 'error', 'message' => 'Missing fields']);
    exit;
}

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: CineCAST <noreply@cinecast.sk>',
    'Reply-To: noreply@cinecast.sk',
]);

$sent = mail($to, $subject, $html, $headers);

if ($sent) {
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'mail() failed']);
}
