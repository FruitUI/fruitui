<?php

namespace FruitUI\Tests;

use FruitUI\Fruit;
use FruitUI\FruitUIServiceProvider;
use FruitUI\Rules\Tokens;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\ViewErrorBag;
use Illuminate\View\ViewException;
use Livewire\Attributes\Computed;
use Livewire\Component;
use Livewire\Livewire;
use Livewire\WithPagination;
use LogicException;
use PHPUnit\Framework\AssertionFailedError;
use PHPUnit\Framework\Attributes\DataProvider;

class LaravelIntegrationTest extends TestCase
{
    private function shareErrors(array $messages): void
    {
        view()->share('errors', (new ViewErrorBag)->put('default', new MessageBag($messages)));
    }

    #[DataProvider('errorKeys')]
    public function test_field_shows_the_shared_validation_error_for_its_control(string $control, string $key): void
    {
        $this->shareErrors([$key => ['The value is invalid.'], 'other' => ['Unrelated.']]);
        $html = Blade::render('<x-fruit::field control-id="value" label="Value" description="Help">'.$control.'</x-fruit::field>');
        $this->assertStringContainsString('aria-describedby="value-description value-error"', $html);
        $this->assertStringContainsString('aria-invalid="true"', $html);
        $this->assertStringContainsString('<p class="f-error" id="value-error">The value is invalid.</p>', $html);
        $this->assertStringNotContainsString('Unrelated.', $html);
    }

    public static function errorKeys(): array
    {
        return [
            'model' => ['<x-fruit::input wire:model.live.blur="form.email" name="email" />', 'form.email'],
            'name' => ['<x-fruit::input name="email" />', 'email'],
            'nested name' => ['<x-fruit::textarea name="items[0][notes]" />', 'items.0.notes'],
            'list name' => ['<x-fruit::select name="folders[]" multiple><option>A</option></x-fruit::select>', 'folders'],
            'enhanced control' => ['<x-fruit::combobox name="owner" wire:model="owner"><option>A</option></x-fruit::combobox>', 'owner'],
        ];
    }

    public function test_field_explicit_error_wins_and_an_empty_error_suppresses_lookup(): void
    {
        $this->shareErrors(['email' => ['From the bag.']]);
        $explicit = Blade::render('<x-fruit::field control-id="email" label="Email" error="Explicit."><x-fruit::input name="email" /></x-fruit::field>');
        $this->assertStringContainsString('>Explicit.</p>', $explicit);
        $this->assertStringNotContainsString('From the bag.', $explicit);
        $none = Blade::render('<x-fruit::field control-id="email" label="Email" error=""><x-fruit::input name="email" /></x-fruit::field>');
        $this->assertStringNotContainsString('f-error', $none);
        $this->assertStringNotContainsString('aria-invalid', $none);
    }

    public function test_field_without_errors_or_shared_bag_renders_no_error(): void
    {
        $html = Blade::render('<x-fruit::field control-id="email" label="Email"><x-fruit::input name="email" /></x-fruit::field>');
        $this->assertStringNotContainsString('f-error', $html);
        $this->assertStringNotContainsString('aria-describedby', $html);
    }

    public function test_field_derives_its_control_id_when_control_id_is_omitted(): void
    {
        $this->shareErrors(['form.email' => ['Enter an email.']]);
        $model = $this->xpath(Blade::render('<x-fruit::field label="Email"><x-fruit::input wire:model="form.email" /></x-fruit::field>'));
        $this->assertSame('field-form-email', $model->query('//input')->item(0)->getAttribute('id'));
        $this->assertSame('field-form-email', $model->query('//label')->item(0)->getAttribute('for'));
        $this->assertSame('field-form-email-error', $model->query('//p[@class="f-error"]')->item(0)->getAttribute('id'));
        $own = $this->xpath(Blade::render('<x-fruit::field label="Name"><x-fruit::input id="profile-name" /></x-fruit::field>'));
        $this->assertSame('profile-name', $own->query('//label')->item(0)->getAttribute('for'));
    }

    public function test_choice_controls_join_a_field_and_show_their_validation_error(): void
    {
        $this->shareErrors(['terms' => ['Accept the terms to continue.']]);
        $xpath = $this->xpath(Blade::render('<x-fruit::field label="Terms" description="Required to create an account."><x-fruit::checkbox wire:model="terms">I accept the terms</x-fruit::checkbox></x-fruit::field>'));
        $input = $xpath->query('//input')->item(0);
        $this->assertSame('field-terms', $input->getAttribute('id'));
        $this->assertSame('field-terms', $xpath->query('//label[@class="f-label"]')->item(0)->getAttribute('for'));
        $this->assertSame('field-terms-description field-terms-error', $input->getAttribute('aria-describedby'));
        $this->assertSame('true', $input->getAttribute('aria-invalid'));
        $this->assertSame('checkbox', $input->getAttribute('type'));
        $this->assertSame('Accept the terms to continue.', $xpath->query('//p[@class="f-error"]')->item(0)->textContent);
    }

    public function test_field_reads_a_named_error_bag(): void
    {
        view()->share('errors', (new ViewErrorBag)->put('default', new MessageBag)->put('updatePassword', new MessageBag(['password' => ['Too short.']])));
        $default = Blade::render('<x-fruit::field label="Password"><x-fruit::input type="password" name="password" /></x-fruit::field>');
        $this->assertStringNotContainsString('Too short.', $default);
        $named = Blade::render('<x-fruit::field label="Password" bag="updatePassword"><x-fruit::input type="password" name="password" /></x-fruit::field>');
        $this->assertStringContainsString('>Too short.</p>', $named);
    }

    #[DataProvider('invalidFields')]
    public function test_field_rejects_ambiguous_associations(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function invalidFields(): array
    {
        return [
            ['<x-fruit::field label="Size"><x-fruit::radio name="size" value="s">S</x-fruit::radio><x-fruit::radio name="size" value="m">M</x-fruit::radio></x-fruit::field>', 'associates one control'],
            ['<x-fruit::field label="Plain"><input class="f-input"></x-fruit::field>', 'needs a control-id when its control is plain HTML'],
            ['<x-fruit::field label="Nothing"><x-fruit::input /></x-fruit::field>', 'needs a control-id, or a control with'],
            ['<x-fruit::field label="Email" bag=""><x-fruit::input name="email" /></x-fruit::field>', 'bag must name an error bag'],
        ];
    }

    public function test_livewire_validation_errors_reach_field(): void
    {
        Livewire::test(FieldErrorsFixture::class)
            ->call('save')
            ->assertHasErrors('form.email')
            ->assertSeeHtml('aria-invalid="true"')
            ->assertSeeHtml('<p class="f-error" id="email-error">The form.email field is required.</p>');
    }

    public function test_avatar_is_decorative_unless_it_carries_the_identity(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::avatar>SC</x-fruit::avatar><x-fruit::avatar label="Sophie Chen">SC</x-fruit::avatar><x-fruit::avatar src="/sophie.png" label="Sophie Chen" /><x-fruit::avatar src="/sophie.png" />'));
        $avatars = $xpath->query('//span[contains(@class, "f-avatar")]');
        $this->assertSame('true', $avatars->item(0)->getAttribute('aria-hidden'));
        $this->assertSame('img', $avatars->item(1)->getAttribute('role'));
        $this->assertSame('Sophie Chen', $avatars->item(1)->getAttribute('aria-label'));
        $this->assertSame('Sophie Chen', $xpath->query('.//img', $avatars->item(2))->item(0)->getAttribute('alt'));
        $this->assertFalse($avatars->item(2)->hasAttribute('aria-hidden'));
        $this->assertSame('', $xpath->query('.//img', $avatars->item(3))->item(0)->getAttribute('alt'));
        $this->assertSame('true', $avatars->item(3)->getAttribute('aria-hidden'));
    }

    public function test_badge_tooltip_and_sidebar_render_their_native_markup(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::badge class="custom">12 unread</x-fruit::badge>
            <x-fruit::tooltip text="Move to the archive." text-id="archive-help">
                <x-fruit::button aria-describedby="archive-help">Archive</x-fruit::button>
            </x-fruit::tooltip>
            <x-fruit::sidebar aria-label="Mailboxes">
                <x-slot:header><strong>Studio</strong></x-slot:header>
                <x-slot:footer class="account"><strong>Alex Morgan</strong></x-slot:footer>
                <x-fruit::sidebar-item href="/inbox" current wire:navigate>Inbox<x-slot:badge>12</x-slot:badge></x-fruit::sidebar-item>
                <x-fruit::sidebar-group title="Work" subtitle="alex@example.com" open>
                    <x-fruit::sidebar-item href="/work/inbox">Inbox</x-fruit::sidebar-item>
                </x-fruit::sidebar-group>
            </x-fruit::sidebar>
            BLADE);
        $xpath = $this->xpath($html);
        $this->assertSame('f-badge custom', $xpath->query('//span[contains(@class, "f-badge")]')->item(0)->getAttribute('class'));
        $tooltip = $xpath->query('//span[@role="tooltip"]')->item(0);
        $this->assertSame('archive-help', $tooltip->getAttribute('id'));
        $this->assertSame('fruitTooltip', $tooltip->parentNode->getAttribute('x-data'));
        $this->assertSame('archive-help', $xpath->query('//button')->item(0)->getAttribute('aria-describedby'));
        $this->assertSame('Mailboxes', $xpath->query('//nav[@class="f-sidebar"]')->item(0)->getAttribute('aria-label'));
        $this->assertSame('Studio', trim($xpath->query('//nav/div[@class="f-sidebar__header"]')->item(0)->textContent));
        $footer = $xpath->query('//nav[@class="f-sidebar"]/*[last()]')->item(0);
        $this->assertEqualsCanonicalizing(['f-sidebar__footer', 'account'], explode(' ', $footer->getAttribute('class')));
        $links = $xpath->query('//a[contains(@class, "f-sidebar__item")]');
        $this->assertSame('page', $links->item(0)->getAttribute('aria-current'));
        $this->assertMatchesRegularExpression('/<a\b[^>]*wire:navigate[^>]*>/', $html);
        $this->assertSame('12', trim($xpath->query('.//span[@class="f-badge"]', $links->item(0))->item(0)->textContent));
        $this->assertFalse($links->item(1)->hasAttribute('aria-current'));
        $this->assertSame('details', $links->item(1)->parentNode->nodeName);
        $this->assertTrue($links->item(1)->parentNode->hasAttribute('open'));
        $this->assertSame('alex@example.com', $xpath->query('//summary//small')->item(0)->textContent);
    }

    public function test_named_dialog_and_toaster_render_their_event_contracts(): void
    {
        session()->flash('fruit-toast', 'Saved from the last request.');
        $html = Blade::render('<x-fruit::dialog name="confirm-delete" aria-label="Delete">Sure?</x-fruit::dialog><x-fruit::dialog aria-label="Plain">Plain</x-fruit::dialog><x-fruit::toaster :duration="3000" />');
        $xpath = $this->xpath($html);
        $dialogs = $xpath->query('//dialog');
        $this->assertSame('confirm-delete', $dialogs->item(0)->getAttribute('data-fruit-dialog'));
        $this->assertFalse($dialogs->item(1)->hasAttribute('data-fruit-dialog'));
        $this->assertMatchesRegularExpression('/<dialog\b[^>]*wire:ignore\.self[^>]*>/', $html);
        $toaster = $xpath->query('//div[@role="status"]')->item(0);
        $this->assertSame('f-toast', $toaster->getAttribute('class'));
        $this->assertStringContainsString('"duration":3000', $toaster->getAttribute('x-data'));
        $this->assertStringContainsString('Saved from the last request.', $toaster->getAttribute('x-data'));
        $this->assertSame('notice', $toaster->getAttribute('x-show'));
    }

    #[DataProvider('invalidAdapters')]
    public function test_new_adapters_reject_unsupported_contracts(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function invalidAdapters(): array
    {
        return [
            ['<x-fruit::avatar role="button">SC</x-fruit::avatar>', 'overriding role'],
            ['<x-fruit::badge as="button">1</x-fruit::badge>', 'fixed native element'],
            ['<x-fruit::tooltip text="Help"><button>Go</button></x-fruit::tooltip>', 'text-id'],
            ['<x-fruit::tooltip text="Help" text-id="help" x-data="other"><button>Go</button></x-fruit::tooltip>', 'owns its fruitTooltip helper'],
            ['<x-fruit::sidebar role="list">Items</x-fruit::sidebar>', 'overriding role'],
            ['<x-fruit::context-menu role="listbox">Items</x-fruit::context-menu>', 'overriding role'],
            ['<x-fruit::context-menu x-data="other">Items</x-fruit::context-menu>', 'owns its fruitContextMenu helper'],
            ['<x-fruit::context-menu x-bind:hidden="closed">Items</x-fruit::context-menu>', 'owns its fruitContextMenu helper'],
            ['<x-fruit::sidebar-item>Inbox</x-fruit::sidebar-item>', 'requires href'],
            ['<x-fruit::sidebar-item href="/" role="button">Inbox</x-fruit::sidebar-item>', 'overriding role'],
            ['<x-fruit::sidebar-item href="/" current="yes">Inbox</x-fruit::sidebar-item>', 'current must be a boolean'],
            ['<x-fruit::sidebar-group title="Work" as="nav">Items</x-fruit::sidebar-group>', 'fixed native element'],
            ['<x-fruit::toaster x-show="open" />', 'owns its fruitToast helper'],
            ['<x-fruit::toaster duration="soon" />', 'nonnegative number'],
            ['<x-fruit::toaster role="alert" />', 'overriding role'],
            ['<x-fruit::dialog name="two words">Hi</x-fruit::dialog>', 'dialog name must be'],
        ];
    }

    public function test_pagination_view_renders_links_outside_livewire(): void
    {
        $paginator = new LengthAwarePaginator(range(11, 20), 45, 10, 2, ['path' => '/customers']);
        $xpath = $this->xpath((string) $paginator->links('fruit::pagination.default'));
        $this->assertSame('Pagination', $xpath->query('//nav[contains(@class, "f-pagination")]')->item(0)->getAttribute('aria-label'));
        $this->assertSame('11–20 of 45', $xpath->query('//nav/span')->item(0)->textContent);
        $this->assertSame('/customers?page=1', $xpath->query('//a[@rel="prev"]')->item(0)->getAttribute('href'));
        $this->assertSame('/customers?page=3', $xpath->query('//a[@rel="next"]')->item(0)->getAttribute('href'));
        $current = $xpath->query('//a[@aria-current="page"]');
        $this->assertSame(1, $current->length);
        $this->assertSame('Page 2', $current->item(0)->getAttribute('aria-label'));

        $first = new LengthAwarePaginator(range(1, 10), 45, 10, 1, ['path' => '/customers']);
        $this->assertTrue($this->xpath((string) $first->links('fruit::pagination.default'))->query('//button[text()="Previous"]')->item(0)->hasAttribute('disabled'));
        $this->assertSame('', trim((string) (new LengthAwarePaginator([1], 1, 10, 1))->links('fruit::pagination.default')));

        $simple = new Paginator(range(1, 11), 10, 1, ['path' => '/log']);
        $simpleXpath = $this->xpath((string) $simple->links('fruit::pagination.default'));
        $this->assertSame('/log?page=2', $simpleXpath->query('//a[@rel="next"]')->item(0)->getAttribute('href'));
        $this->assertSame(0, $simpleXpath->query('//nav/span')->length);
    }

    public function test_the_fruit_livewire_pagination_theme_uses_livewire_page_actions(): void
    {
        Livewire::test(PaginationFixture::class)
            ->assertSeeHtml('class="f-pagination"')
            ->assertSeeHtml('wire:click="nextPage(&#039;page&#039;)"')
            ->assertSeeHtml('wire:click="gotoPage(2, &#039;page&#039;)"')
            ->call('nextPage', 'page')
            ->assertSeeHtml('11–20 of 25')
            ->assertSeeHtml('wire:click="previousPage(&#039;page&#039;)"');

        Livewire::test(PaginationFixture::class, ['simple' => true])
            ->assertSeeHtml('class="f-pagination"')
            ->assertSeeHtml('wire:click="nextPage(&#039;page&#039;)"')
            ->assertDontSeeHtml('gotoPage');
    }

    public function test_fruit_feedback_dispatches_from_livewire_and_flashes_elsewhere(): void
    {
        Livewire::test(FeedbackFixture::class)
            ->call('archive')
            ->assertDispatched('fruit-toast', message: 'Conversation archived.')
            ->assertDispatched('fruit-dialog-close', name: 'confirm-archive')
            ->call('confirm')
            ->assertDispatched('fruit-dialog-open', name: 'confirm-archive');

        Fruit::toast('Saved from a controller.');
        $this->assertSame('Saved from a controller.', session('fruit-toast'));
        Fruit::flashToast('See you soon.');
        $this->assertSame('See you soon.', session('fruit-toast'));
        $this->expectException(LogicException::class);
        Fruit::openDialog('confirm-archive');
    }

    public function test_a_context_menu_is_a_hidden_menu_that_keeps_its_open_state_through_morphs(): void
    {
        $xpath = $this->xpath(Blade::render('<li><button class="f-item-row">Sophie</button><x-fruit::context-menu class="extra"><x-fruit::menu-item wire:click="archive(4)">Archive</x-fruit::menu-item></x-fruit::context-menu></li>'));
        $menu = $xpath->query('//li/div')->item(0);
        $this->assertSame('menu', $menu->getAttribute('role'));
        $this->assertSame('Actions', $menu->getAttribute('aria-label'));
        $this->assertSame('fruitContextMenu', $menu->getAttribute('x-data'));
        $this->assertTrue($menu->hasAttribute('hidden'));
        $this->assertTrue($menu->hasAttribute('wire:ignore.self'));
        $this->assertSame('f-menu__items f-context-menu extra', $menu->getAttribute('class'));
        $this->assertSame('archive(4)', $xpath->query('.//button[@role="menuitem"]', $menu)->item(0)->getAttribute('wire:click'));
    }

    public function test_livewire_tests_assert_fruit_feedback_directly(): void
    {
        Livewire::test(FeedbackFixture::class)
            ->assertNotToasted()
            ->call('archive')
            ->assertToasted()
            ->assertToasted('Conversation archived.')
            ->assertDialogClosed('confirm-archive')
            ->call('confirm')
            ->assertDialogOpened('confirm-archive')
            ->assertNotToasted();

        // A toast flashed before a redirect counts too.
        Livewire::test(FeedbackFixture::class)->call('leave')->assertToasted('See you on the next page.')->assertRedirect('/inbox');

        $failures = 0;
        foreach ([
            fn () => Livewire::test(FeedbackFixture::class)->call('archive')->assertToasted('Something else.'),
            fn () => Livewire::test(FeedbackFixture::class)->call('confirm')->assertToasted(),
            fn () => Livewire::test(FeedbackFixture::class)->call('archive')->assertNotToasted(),
            fn () => Livewire::test(FeedbackFixture::class)->call('archive')->assertDialogOpened('confirm-archive'),
        ] as $assertion) {
            session()->forget('fruit-toast');
            try {
                $assertion();
            } catch (AssertionFailedError) {
                $failures++;
            }
        }
        $this->assertSame(4, $failures);
    }

    public function test_compiled_assets_publish_for_hosts_without_a_bundler(): void
    {
        $paths = ServiceProvider::pathsToPublish(FruitUIServiceProvider::class, 'fruit-assets');
        $this->assertCount(1, $paths);
        $source = array_key_first($paths);
        $this->assertSame(realpath(__DIR__.'/../../build'), realpath($source));
        $this->assertSame(public_path('vendor/fruitui'), $paths[$source]);
        foreach (['fruitui.css', 'core.compat.css', 'layout.compat.css', 'livewire.global.js', 'alpine.global.js', 'editor.global.js'] as $file) {
            $this->assertFileExists("{$source}/{$file}");
        }
        // Laravel's skeleton re-publishes this group in post-update-cmd, keeping the copy current.
        $this->assertSame($paths, ServiceProvider::pathsToPublish(FruitUIServiceProvider::class, 'laravel-assets'));
    }

    public function test_token_values_split_the_way_the_token_field_shows_them(): void
    {
        $this->assertSame(['ann@example.com', 'bob@example.com', '0'], Fruit::tokens(" ann@example.com\r\n\n bob@example.com \nann@example.com\n0\n"));
        $this->assertSame([], Fruit::tokens(''));
        $this->assertSame([], Fruit::tokens(null));
    }

    public function test_the_tokens_rule_validates_each_entry_under_the_fields_own_key(): void
    {
        $rules = ['cc' => ['nullable', new Tokens('email')]];
        $this->assertTrue(Validator::make(['cc' => "ann@example.com\nbob@example.com"], $rules)->passes());
        $this->assertTrue(Validator::make(['cc' => ''], $rules)->passes());

        $errors = Validator::make(['cc' => "ann@example.com\nbob@"], $rules)->errors();
        $this->assertSame(['The cc field contains an invalid entry: bob@.'], $errors->get('cc'));
        $this->assertSame(['The cc field must be a string.'], Validator::make(['cc' => ['ann@example.com']], $rules)->errors()->get('cc'));

        Livewire::test(TokensFixture::class)
            ->set('cc', "ann@example.com\nnot-an-address")
            ->call('send')
            ->assertHasErrors('cc')
            ->assertSeeHtml('<p class="f-error" id="field-cc-error">The cc field contains an invalid entry: not-an-address.</p>')
            ->set('cc', 'ann@example.com')
            ->call('send')
            ->assertHasNoErrors()
            ->assertSet('sent', ['ann@example.com']);
    }

    public function test_dialogs_bind_their_open_state_with_wire_model(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::dialog wire:model="closing" aria-label="Close">Sure?</x-fruit::dialog><x-fruit::dialog aria-label="Plain">Plain</x-fruit::dialog>'));
        $bound = $xpath->query('//dialog')->item(0);
        $this->assertSame('fruitDialogModel', $bound->getAttribute('x-data'));
        $this->assertSame('open', $bound->getAttribute('x-modelable'));
        $this->assertSame('closing', $bound->getAttribute('wire:model'));
        $this->assertFalse($xpath->query('//dialog')->item(1)->hasAttribute('x-data'));
        $this->expectException(ViewException::class);
        Blade::render('<x-fruit::dialog wire:model="closing" x-data="{ other: true }">Sure?</x-fruit::dialog>');
    }
}

class FieldErrorsFixture extends Component
{
    public array $form = ['email' => ''];

    public function save(): void
    {
        $this->validate(['form.email' => 'required']);
    }

    public function render()
    {
        return <<<'BLADE'
            <div><x-fruit::field control-id="email" label="Email"><x-fruit::input type="email" wire:model="form.email" /></x-fruit::field></div>
            BLADE;
    }
}

class PaginationFixture extends Component
{
    use WithPagination;

    public bool $simple = false;

    #[Computed]
    public function items(): LengthAwarePaginator|Paginator
    {
        $items = collect(range(1, 25));

        return $this->simple
            ? new Paginator($items->slice(($this->getPage() - 1) * 10, 11)->values(), 10, $this->getPage())
            : new LengthAwarePaginator($items->forPage($this->getPage(), 10), $items->count(), 10, $this->getPage());
    }

    public function render()
    {
        return '<div>{{ $this->items->links() }}</div>';
    }
}

class FeedbackFixture extends Component
{
    public function archive(): void
    {
        Fruit::closeDialog('confirm-archive');
        Fruit::toast('Conversation archived.');
    }

    public function confirm(): void
    {
        Fruit::openDialog('confirm-archive');
    }

    public function leave(): void
    {
        Fruit::flashToast('See you on the next page.');
        $this->redirect('/inbox');
    }

    public function render()
    {
        return '<div><x-fruit::toaster /></div>';
    }
}

class TokensFixture extends Component
{
    public string $cc = '';

    public array $sent = [];

    public function send(): void
    {
        $this->validate(['cc' => ['required', new Tokens('email')]]);
        $this->sent = Fruit::tokens($this->cc);
    }

    public function render()
    {
        return <<<'BLADE'
            <div><x-fruit::field label="Cc"><x-fruit::token-field wire:model="cc" /></x-fruit::field></div>
            BLADE;
    }
}
