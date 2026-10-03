<?php

namespace FruitUI\Gallery;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;
use RuntimeException;

/**
 * Renders each Blade specimen into components.html twice: as the live specimen
 * between <!-- blade:id --> markers, and as the escaped source shown in the
 * specimen's Blade panel. The gallery page stays static for Vite.
 */
final class GalleryRenderer
{
    /** Validation messages shared with specimens, as a Laravel request would. */
    private const ERRORS = ['email' => ['Enter a complete email address.']];

    public static function render(string $page, string $specimens): string
    {
        view()->share('errors', (new ViewErrorBag)->put('default', new MessageBag(self::ERRORS)));
        foreach (glob($specimens.'/*.blade.php') as $file) {
            $id = basename($file, '.blade.php');
            $source = trim(file_get_contents($file));
            $live = trim(Blade::render($source));
            $page = self::replace($page, "/(<!-- blade:{$id} -->).*?(<!-- \\/blade:{$id} -->)/s", $live, "live markers for {$id}");
            $escaped = htmlspecialchars($source, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
            $page = self::replace($page, "/(<pre class=\"code\" data-blade-source=\"{$id}\">).*?(<\\/pre>)/s", $escaped, "a Blade source panel for {$id}");
        }

        return $page;
    }

    /** Replace the content between the pattern's two captured delimiters. */
    private static function replace(string $page, string $pattern, string $content, string $missing): string
    {
        $count = 0;
        $result = preg_replace_callback($pattern, fn ($match) => $match[1].$content.$match[2], $page, -1, $count);
        if ($count !== 1) {
            throw new RuntimeException("components.html needs exactly one set of {$missing}.");
        }

        return $result;
    }
}
