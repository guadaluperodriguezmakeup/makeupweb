<?php
/**
 * Guarda contactos en SQLite y envía aviso por correo (PHPMailer + SMTP).
 * Copia smtp-config.example.php → smtp-config.php y ejecuta composer install.
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['estado' => 'error', 'mensaje' => 'Método no permitido']);
    exit;
}

$nombre = isset($_POST['nombre']) ? trim((string) $_POST['nombre']) : '';
$correo = isset($_POST['correo']) ? trim((string) $_POST['correo']) : '';
$mensaje = isset($_POST['mensaje']) ? trim((string) $_POST['mensaje']) : '';

if ($nombre === '' || $correo === '' || $mensaje === '') {
    http_response_code(400);
    echo json_encode(['estado' => 'error', 'mensaje' => 'Faltan datos obligatorios.']);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['estado' => 'error', 'mensaje' => 'Correo no válido.']);
    exit;
}

$configPath = __DIR__ . '/smtp-config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode([
        'estado' => 'error',
        'mensaje' => 'Falta smtp-config.php (copia smtp-config.example.php).',
    ]);
    exit;
}

/** @var array{host:string,port:int,username:string,password:string,from_email:string,from_name:string,to_email:string} $smtp */
$smtp = require $configPath;

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir) && !@mkdir($dataDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['estado' => 'error', 'mensaje' => 'No se pudo crear la carpeta de datos.']);
    exit;
}

$dbPath = $dataDir . '/contactos.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS contactos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            creado_en TEXT NOT NULL DEFAULT (datetime(\'now\'))
        )'
    );
    $stmt = $pdo->prepare('INSERT INTO contactos (nombre, correo, mensaje) VALUES (:nombre, :correo, :mensaje)');
    $stmt->execute([
        ':nombre' => $nombre,
        ':correo' => $correo,
        ':mensaje' => $mensaje,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['estado' => 'error', 'mensaje' => 'No se pudo guardar en la base de datos.']);
    exit;
}

$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoload)) {
    echo json_encode([
        'estado' => 'error',
        'mensaje' => 'Tus datos se guardaron, pero falta composer install (PHPMailer) para enviar el correo.',
    ]);
    exit;
}

require $autoload;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $smtp['host'];
    $mail->Port = (int) $smtp['port'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->SMTPAuth = true;
    $mail->Username = $smtp['username'];
    $mail->Password = $smtp['password'];

    $mail->setFrom($smtp['from_email'], $smtp['from_name']);
    $mail->addAddress($smtp['to_email']);
    $mail->addReplyTo($correo, $nombre);

    $mail->isHTML(false);
    $mail->Subject = 'Contacto web: ' . $nombre;
    $mail->Body = "Nombre: {$nombre}\nCorreo: {$correo}\n\nMensaje:\n{$mensaje}";

    $mail->send();
    echo json_encode(['estado' => 'ok', 'mensaje' => 'Mensaje enviado correctamente.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'estado' => 'error',
        'mensaje' => 'Tus datos se guardaron, pero no se pudo enviar el correo. Revisa SMTP en smtp-config.php.',
    ]);
}
