// Node has no page URL; the runners resolve their bundled files against location.href at import time.
(globalThis as { location?: unknown }).location ??= new URL('http://localhost/');
