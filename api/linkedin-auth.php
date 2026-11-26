<?php
// One-time sign-in of a Westbridge Finance page admin, so the site can read the page's posts.
// Open /api/linkedin-auth.php?key=ADMIN_KEY, sign in to LinkedIn and approve access.
// Repeat only when the refresh token expires (about once a year).
require __DIR__ . '/_linkedin.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex');
session_start();

function page(string $msg): void {
    echo '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>LinkedIn</title>'
       . '<body style="font:16px/1.5 system-ui;max-width:560px;margin:60px auto;padding:0 20px">' . $msg . '</body>';
    exit;
}

try { $cfg = li_config(); } catch (Throwable $e) { page('Brak pliku config.php w folderze prywatnym.'); }

// LinkedIn sends the admin back here with ?code=...&state=...
if (isset($_GET['code'], $_GET['state'])) {
    if (!hash_equals($_SESSION['li_state'] ?? '', (string) $_GET['state'])) page('Nieprawidłowy stan logowania. Zacznij od nowa.');
    [$code, $res] = li_http('POST', 'https://www.linkedin.com/oauth/v2/accessToken',
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query([
            'grant_type'    => 'authorization_code',
            'code'          => $_GET['code'],
            'redirect_uri'  => $cfg['redirect_uri'],
            'client_id'     => $cfg['client_id'],
            'client_secret' => $cfg['client_secret'],
        ]));
    $tok = json_decode($res, true);
    if ($code !== 200 || empty($tok['access_token'])) page('LinkedIn nie wydał tokenu (kod ' . $code . ').');
    li_save_token($tok);
    @unlink(li_private_dir() . '/posts-cache.json');
    page('Gotowe. Strona pobiera teraz posty z profilu Westbridge Finance.');
}

if (isset($_GET['error'])) page('Logowanie przerwane: ' . htmlspecialchars((string) $_GET['error']));

// Start: only with the admin key from config.php
if (empty($cfg['admin_key']) || !hash_equals($cfg['admin_key'], (string) ($_GET['key'] ?? ''))) { http_response_code(404); page('Nie znaleziono.'); }

$_SESSION['li_state'] = bin2hex(random_bytes(16));
header('Location: https://www.linkedin.com/oauth/v2/authorization?' . http_build_query([
    'response_type' => 'code',
    'client_id'     => $cfg['client_id'],
    'redirect_uri'  => $cfg['redirect_uri'],
    'state'         => $_SESSION['li_state'],
    'scope'         => 'r_organization_social',
]));
exit;
