<?php
// Latest posts from the Westbridge Finance LinkedIn page as JSON for the homepage.
// Answers from a cache; asks LinkedIn again only when the cache is older than cache_ttl.
require __DIR__ . '/_linkedin.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$cacheFile = li_private_dir() . '/posts-cache.json';
$cache = li_read_json($cacheFile);

try {
    $cfg = li_config();
    $fresh = $cache && (time() - ($cache['fetched_at'] ?? 0)) < (int) $cfg['cache_ttl'];
    if (!$fresh) {
        // one refresh at a time; other requests get the previous cache meanwhile
        $lock = fopen(li_private_dir() . '/posts.lock', 'c');
        if ($lock && flock($lock, LOCK_EX | LOCK_NB)) {
            $cache = ['fetched_at' => time(), 'posts' => li_fetch_posts($cfg)];
            li_write_json($cacheFile, $cache);
            flock($lock, LOCK_UN);
        }
    }
} catch (Throwable $e) {
    error_log('[linkedin-posts] ' . $e->getMessage());
    // keep showing the last good posts if LinkedIn is unavailable
}

header('Cache-Control: public, max-age=600');
echo json_encode(['posts' => $cache['posts'] ?? []], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
