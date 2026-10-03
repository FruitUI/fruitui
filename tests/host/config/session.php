<?php

return ['driver' => 'file', 'lifetime' => 120, 'files' => dirname(__DIR__).'/.runtime/storage/framework/sessions', 'cookie' => 'fruitui_test_session', 'path' => '/', 'domain' => null, 'secure' => false, 'http_only' => true, 'same_site' => 'lax', 'lottery' => [0, 100]];
