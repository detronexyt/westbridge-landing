<?php
// Shared helpers for the LinkedIn integration. Not meant to be opened directly.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }

// Private folder with config.php, the token and the post cache, outside the web root
function li_private_dir(): string {
    $env = getenv('WBF_PRIVATE_DIR');
    if ($env) return rtrim($env, '/');
    return dirname(__DIR__, 2) . '/westbridge-private';
}

function li_config(): array {
    $file = li_private_dir() . '/config.php';
    if (!is_file($file)) throw new RuntimeException('Missing config.php in the private folder');
    return require $file;
}

function li_read_json(string $file): ?array {
    if (!is_file($file)) return null;
    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : null;
}

function li_write_json(string $file, array $data): void {
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    rename($tmp, $file);
}

function li_http(string $method, string $url, array $headers = [], ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => $headers,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$code, $res === false ? '' : $res];
}

// Saved token, refreshed with the refresh token when it is about to expire
function li_access_token(array $cfg): string {
    $file = li_private_dir() . '/token.json';
    $tok = li_read_json($file);
    if (!$tok || empty($tok['access_token'])) throw new RuntimeException('Not signed in yet: open linkedin-auth.php');
    if (($tok['expires_at'] ?? 0) > time() + 300) return $tok['access_token'];
    if (empty($tok['refresh_token'])) throw new RuntimeException('Token expired: open linkedin-auth.php again');
    [$code, $res] = li_http('POST', 'https://www.linkedin.com/oauth/v2/accessToken',
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query([
            'grant_type'    => 'refresh_token',
            'refresh_token' => $tok['refresh_token'],
            'client_id'     => $cfg['client_id'],
            'client_secret' => $cfg['client_secret'],
        ]));
    $new = json_decode($res, true);
    if ($code !== 200 || empty($new['access_token'])) throw new RuntimeException('Token refresh failed (' . $code . ')');
    li_save_token($new + ['refresh_token' => $tok['refresh_token']]);
    return $new['access_token'];
}

function li_save_token(array $t): void {
    li_write_json(li_private_dir() . '/token.json', [
        'access_token'       => $t['access_token'],
        'expires_at'         => time() + (int) ($t['expires_in'] ?? 0),
        'refresh_token'      => $t['refresh_token'] ?? null,
        'refresh_expires_at' => isset($t['refresh_token_expires_in']) ? time() + (int) $t['refresh_token_expires_in'] : null,
    ]);
}

function li_api(array $cfg, string $token, string $path): array {
    [$code, $res] = li_http('GET', 'https://api.linkedin.com/rest/' . $path, [
        'Authorization: Bearer ' . $token,
        'LinkedIn-Version: ' . $cfg['api_version'],
        'X-Restli-Protocol-Version: 2.0.0',
    ]);
    $data = json_decode($res, true);
    if ($code !== 200 || !is_array($data)) throw new RuntimeException('LinkedIn API error ' . $code . ' for ' . strtok($path, '?'));
    return $data;
}

// Copies a post image to our own server, so visitors never load anything from LinkedIn
function li_cache_image(array $cfg, string $token, string $imageUrn): ?string {
    $dir = __DIR__ . '/li-media';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $name = substr(sha1($imageUrn), 0, 16) . '.jpg';
    if (is_file($dir . '/' . $name)) return 'api/li-media/' . $name;
    try {
        $img = li_api($cfg, $token, 'images/' . rawurlencode($imageUrn));
    } catch (Throwable $e) { return null; }
    if (empty($img['downloadUrl'])) return null;
    [$code, $bin] = li_http('GET', $img['downloadUrl']);
    if ($code !== 200 || strlen($bin) < 100) return null;
    file_put_contents($dir . '/' . $name, $bin);
    return 'api/li-media/' . $name;
}

function li_fetch_posts(array $cfg): array {
    $token = li_access_token($cfg);
    $author = rawurlencode('urn:li:organization:' . $cfg['org_id']);
    $data = li_api($cfg, $token, 'posts?author=' . $author . '&q=author&count=20&sortBy=LAST_MODIFIED');
    $out = [];
    foreach ($data['elements'] ?? [] as $p) {
        if (($p['lifecycleState'] ?? '') !== 'PUBLISHED' || ($p['visibility'] ?? '') !== 'PUBLIC') continue;
        if (!empty($p['reshareContext'])) continue;          // skip plain reshares
        $text = trim((string) ($p['commentary'] ?? ''));
        // LinkedIn "little text" escapes and mentions: keep only the readable text
        $text = preg_replace('/@\[([^\]]+)\]\([^)]*\)/', '$1', $text);
        $text = preg_replace('/\\\\([\\\\(){}\[\]<>@|~_*#])/', '$1', $text);
        $c = $p['content'] ?? [];
        $imageUrn = $c['media']['id'] ?? ($c['multiImage']['images'][0]['id'] ?? ($c['article']['thumbnail'] ?? null));
        $image = (is_string($imageUrn) && str_starts_with($imageUrn, 'urn:li:image:')) ? li_cache_image($cfg, $token, $imageUrn) : null;
        $out[] = [
            'url'   => 'https://www.linkedin.com/feed/update/' . $p['id'] . '/',
            'text'  => $text,
            'title' => $c['article']['title'] ?? null,
            'date'  => (int) (($p['publishedAt'] ?? $p['createdAt'] ?? 0) / 1000),
            'image' => $image,
        ];
        if (count($out) >= (int) $cfg['post_count']) break;
    }
    return $out;
}
