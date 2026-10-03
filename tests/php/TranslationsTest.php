<?php

namespace FruitUI\Tests;

use FruitUI\Rules\Tokens;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;

class TranslationsTest extends TestCase
{
    private const LANG = __DIR__.'/../../lang';

    /** @return array<string, string> */
    private static function strings(string $locale): array
    {
        return json_decode(file_get_contents(self::LANG."/{$locale}.json"), true, flags: JSON_THROW_ON_ERROR);
    }

    /** Every English key the views and validation rules translate. */
    private static function usedKeys(): array
    {
        $keys = [];
        $sources = [
            [__DIR__.'/../../resources/views', '/(?:__|trans_choice)\(\'((?:[^\'\\\\]|\\\\.)*)\'/'],
            [__DIR__.'/../../src/Laravel', '/\$fail\(\'((?:[^\'\\\\]|\\\\.)*)\'\)->translate/'],
        ];
        foreach ($sources as [$directory, $pattern]) {
            foreach ((new Filesystem)->allFiles($directory) as $file) {
                preg_match_all($pattern, $file->getContents(), $matches);
                $keys = [...$keys, ...$matches[1]];
            }
        }
        // Laravel's own validation.* keys come from the application's language files.
        $keys = array_filter(array_unique($keys), fn (string $key) => ! str_starts_with($key, 'validation.'));
        sort($keys);

        return $keys;
    }

    public static function locales(): array
    {
        return array_map(fn (string $file) => [basename($file, '.json')], glob(self::LANG.'/*.json'));
    }

    public function test_the_english_file_lists_exactly_the_strings_fruitui_translates(): void
    {
        $english = self::strings('en');
        $this->assertSame(self::usedKeys(), array_keys($english));
        foreach ($english as $key => $value) {
            $this->assertSame($key, $value);
        }
    }

    #[DataProvider('locales')]
    public function test_each_locale_translates_every_string_and_keeps_its_placeholders(string $locale): void
    {
        $strings = self::strings($locale);
        $this->assertSame(array_keys(self::strings('en')), array_keys($strings));
        $placeholders = function (string $text) {
            preg_match_all('/:[a-z]+|\{[a-z]+\}/', $text, $matches);
            $found = array_unique($matches[0]);
            sort($found);

            return $found;
        };
        foreach ($strings as $key => $value) {
            $this->assertNotSame('', trim($value), "{$locale}: {$key}");
            // Plural forms each keep the placeholders.
            foreach (explode('|', $value) as $form) {
                $this->assertSame($placeholders($key), $placeholders($form), "{$locale}: {$key}");
            }
        }
    }

    public function test_components_render_in_the_application_locale(): void
    {
        app()->setLocale('nl');
        $paginator = new LengthAwarePaginator(range(1, 3), 9, 3, 2, ['path' => '/tickets']);
        $html = Blade::render('<x-fruit::selection-bar :count="2" /><x-fruit::token-field name="tags" aria-label="Tags" />{{ $paginator->links("fruit::pagination.default") }}', compact('paginator'));
        $this->assertStringContainsString('2 geselecteerd', $html);
        $this->assertStringContainsString('data-fruit-placeholder="Item toevoegen"', $html);
        $this->assertStringContainsString('data-fruit-remove-label="{value} verwijderen"', $html);
        $this->assertStringContainsString('4–6 van 9', $html);
        $this->assertStringContainsString('>Volgende<', $html);

        app()->setLocale('fr');
        $this->assertStringContainsString('1 sélectionné<', Blade::render('<x-fruit::selection-bar :count="1" />'));
        $this->assertStringContainsString('3 sélectionnés<', Blade::render('<x-fruit::selection-bar :count="3" />'));
        $errors = Validator::make(['cc' => 'ann@'], ['cc' => new Tokens('email')])->errors();
        $this->assertSame(['Le champ cc contient une entrée non valide : ann@.'], $errors->get('cc'));
    }

    public function test_published_translations_override_the_shipped_strings(): void
    {
        $published = $this->app->langPath('vendor/fruit');
        $files = new Filesystem;
        $created = ! $files->isDirectory($published);
        $files->ensureDirectoryExists($published);
        $files->put("{$published}/nl.json", json_encode(['Next' => 'Verder']));
        try {
            app()->setLocale('nl');
            $this->assertSame('Verder', __('Next'));
            $this->assertSame('Vorige', __('Previous'));
        } finally {
            $files->delete("{$published}/nl.json");
            if ($created) {
                $files->deleteDirectory($published);
            }
        }
    }
}
