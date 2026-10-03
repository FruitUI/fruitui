<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;
use PHPUnit\Framework\Attributes\DataProvider;

class CompletenessTest extends TestCase
{
    public function test_badge_tones_variants_and_status_dot(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::badge>Plain</x-fruit::badge><x-fruit::badge tone="success" variant="outline"><x-slot:dot></x-slot:dot> Active</x-fruit::badge>'));
        $badges = $xpath->query('//span[contains(@class, "f-badge ") or @class="f-badge"]');
        $this->assertSame('f-badge', $badges->item(0)->getAttribute('class'));
        $this->assertSame('f-badge f-badge--success f-badge--outline', $badges->item(1)->getAttribute('class'));
        $this->assertSame('true', $xpath->query('//span[@class="f-badge__dot"]')->item(0)->getAttribute('aria-hidden'));
    }

    public function test_menu_items_render_their_roles_checked_state_and_shortcuts(): void
    {
        $xpath = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::menu title="View">
                <x-fruit::menu-group label="Sort by">
                    <x-fruit::menu-radio checked wire:click="sortBy('date')">Date</x-fruit::menu-radio>
                    <x-fruit::menu-radio wire:click="sortBy('sender')">Sender</x-fruit::menu-radio>
                </x-fruit::menu-group>
                <x-fruit::menu-separator />
                <x-fruit::menu-checkbox x-bind:aria-checked="String(previews)" shortcut="⌥⌘P">Previews</x-fruit::menu-checkbox>
                <x-fruit::menu-item shortcut="⌘R" aria-keyshortcuts="Meta+R">Refresh</x-fruit::menu-item>
                <x-fruit::menu-link href="/settings" wire:navigate>Settings</x-fruit::menu-link>
            </x-fruit::menu>
            BLADE));
        $radios = $xpath->query('//button[@role="menuitemradio"]');
        $this->assertSame('true', $radios->item(0)->getAttribute('aria-checked'));
        $this->assertSame('false', $radios->item(1)->getAttribute('aria-checked'));
        $this->assertSame('Sort by', $xpath->query('//div[@role="group"]')->item(0)->getAttribute('aria-label'));
        $this->assertSame(1, $xpath->query('//div[@role="separator" and @class="f-menu__separator"]')->length);
        $checkbox = $xpath->query('//button[@role="menuitemcheckbox"]')->item(0);
        $this->assertFalse($checkbox->hasAttribute('aria-checked'), 'A client binding owns aria-checked.');
        $this->assertSame('String(previews)', $checkbox->getAttribute('x-bind:aria-checked'));
        $this->assertSame('⌥⌘P', $xpath->query('.//kbd[@class="f-menu-item__shortcut"]', $checkbox)->item(0)->textContent);
        $this->assertSame('Meta+R', $xpath->query('//button[@role="menuitem"]')->item(0)->getAttribute('aria-keyshortcuts'));
        $link = $xpath->query('//a[@role="menuitem"]')->item(0);
        $this->assertSame('/settings', $link->getAttribute('href'));
        $this->assertSame('f-menu-item', $link->getAttribute('class'));
    }

    public function test_composition_adapters_render_native_markup_with_bindings_on_controls(): void
    {
        $xpath = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::toolbar aria-label="Inbox tools"><strong>Inbox</strong><x-slot:actions><x-fruit::button>Archive</x-fruit::button></x-slot:actions></x-fruit::toolbar>
            <x-fruit::search label="Search mail" wire:model.live="query" :wrapper="['class' => 'wide']" />
            <x-fruit::field label="Find"><x-fruit::search name="find" /></x-fruit::field>
            <x-fruit::spinner />
            <x-fruit::chip>Billing<x-slot:remove wire:click="removeTag('billing')">Remove Billing</x-slot:remove></x-fruit::chip>
            <x-fruit::presence :available="false" label="Away" />
            <x-fruit::segmented legend="Density"><x-fruit::segment name="density" value="compact" wire:model.live="density">Compact</x-fruit::segment></x-fruit::segmented>
            BLADE));
        $toolbar = $xpath->query('//div[@class="f-toolbar"]')->item(0);
        $this->assertSame('Inbox tools', $toolbar->getAttribute('aria-label'));
        $this->assertSame(1, $xpath->query('.//div[@class="f-toolbar__spacer"]/following-sibling::div[@class="f-toolbar__group"]/button', $toolbar)->length);
        $search = $xpath->query('//input[@type="search"]');
        $this->assertSame('Search mail', $search->item(0)->getAttribute('aria-label'));
        $this->assertSame('query', $search->item(0)->getAttribute('wire:model.live'));
        $this->assertSame('f-search wide', $search->item(0)->parentNode->getAttribute('class'));
        $this->assertSame('field-find', $search->item(1)->getAttribute('id'));
        $this->assertSame('true', $xpath->query('//span[@class="f-spinner"]')->item(0)->getAttribute('aria-hidden'));
        $remove = $xpath->query('//span[@class="f-chip"]/button')->item(0);
        $this->assertSame('Remove Billing', $remove->getAttribute('aria-label'));
        $this->assertSame("removeTag('billing')", $remove->getAttribute('wire:click'));
        $this->assertSame('false', $xpath->query('//span[@class="f-presence"]')->item(0)->getAttribute('data-available'));
        $this->assertSame('Away', $xpath->query('//span[@class="f-sr-only"]')->item(0)->textContent);
        $segment = $xpath->query('//fieldset/div[@class="f-segmented"]/label/input')->item(0);
        $this->assertSame('radio', $segment->getAttribute('type'));
        $this->assertSame('density', $segment->getAttribute('wire:model.live'));
        $this->assertSame('Density', $xpath->query('//fieldset/legend')->item(0)->textContent);
    }

    public function test_loading_dividers_timelines_and_breadcrumbs_render_native_structure(): void
    {
        $xpath = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::skeleton :lines="2" />
            <x-fruit::divider tone="accent">New messages</x-fruit::divider>
            <x-fruit::divider />
            <x-fruit::timeline aria-label="History">
                <x-fruit::timeline-item datetime="2026-10-02T10:42">Assigned to Alex<x-slot:detail>By Mia</x-slot:detail><x-slot:time>10:42</x-slot:time></x-fruit::timeline-item>
            </x-fruit::timeline>
            <x-fruit::breadcrumbs>
                <x-fruit::crumb href="/customers" wire:navigate>Customers</x-fruit::crumb>
                <x-fruit::crumb current>Sophie Chen</x-fruit::crumb>
            </x-fruit::breadcrumbs>
            BLADE));
        $skeleton = $xpath->query('//div[@class="f-skeleton"]')->item(0);
        $this->assertSame('true', $skeleton->getAttribute('aria-hidden'));
        $this->assertSame(2, $xpath->query('.//div[@class="f-skeleton__line"]', $skeleton)->length);
        $dividers = $xpath->query('//div[@role="separator"]');
        $this->assertSame('New messages', $dividers->item(0)->getAttribute('aria-label'));
        $this->assertSame('f-divider f-divider--accent', $dividers->item(0)->getAttribute('class'));
        $this->assertFalse($dividers->item(1)->hasAttribute('aria-label'));
        $this->assertSame('History', $xpath->query('//ol[@class="f-timeline"]')->item(0)->getAttribute('aria-label'));
        $this->assertSame('2026-10-02T10:42', $xpath->query('//li[@class="f-timeline__item"]//time')->item(0)->getAttribute('datetime'));
        $this->assertSame('By Mia', $xpath->query('//div[@class="f-timeline__body"]/p')->item(0)->textContent);
        $this->assertSame('Breadcrumb', $xpath->query('//nav[@class="f-breadcrumbs"]')->item(0)->getAttribute('aria-label'));
        $this->assertSame('/customers', $xpath->query('//nav[@class="f-breadcrumbs"]/ol/li/a')->item(0)->getAttribute('href'));
        $this->assertSame('page', $xpath->query('//nav[@class="f-breadcrumbs"]/ol/li/span')->item(0)->getAttribute('aria-current'));
    }

    public function test_messages_render_identity_body_attachments_and_footer(): void
    {
        $xpath = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::message layout="stacked" variant="note" datetime="2026-10-02T10:48" aria-label="Internal note">
                <x-slot:avatar><x-fruit::avatar>MP</x-fruit::avatar></x-slot:avatar>
                <x-slot:author>Mia Patel</x-slot:author>
                <x-slot:meta>Internal note</x-slot:meta>
                <x-slot:time>10:48</x-slot:time>
                Existing projects stay in place.
                <x-slot:attachments><a class="f-attachment" href="/notes.txt">Notes</a></x-slot:attachments>
                <x-slot:footer><x-fruit::button size="small">Reply</x-fruit::button></x-slot:footer>
            </x-fruit::message>
            <x-fruit::divider align="start">2 replies</x-fruit::divider>
            BLADE));
        $message = $xpath->query('//article')->item(0);
        $this->assertSame('f-message f-message--stacked f-message--note', $message->getAttribute('class'));
        $this->assertSame('Internal note', $message->getAttribute('aria-label'));
        $this->assertSame('Mia Patel', $xpath->query('.//strong[@class="f-message__author"]', $message)->item(0)->textContent);
        $this->assertSame('2026-10-02T10:48', $xpath->query('.//time[@class="f-message__time"]', $message)->item(0)->getAttribute('datetime'));
        $this->assertSame('Existing projects stay in place.', trim($xpath->query('.//div[@class="f-message__body"]', $message)->item(0)->textContent));
        $this->assertSame(1, $xpath->query('.//div[@class="f-message__attachments"]/a', $message)->length);
        $this->assertSame(1, $xpath->query('.//footer[@class="f-message__footer"]/button', $message)->length);
        $this->assertSame('f-divider f-divider--start', $xpath->query('//div[@role="separator"]')->item(0)->getAttribute('class'));
    }

    #[DataProvider('invalidAdapters')]
    public function test_completeness_adapters_reject_unsupported_contracts(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function invalidAdapters(): array
    {
        return [
            ['<x-fruit::badge tone="purple">New</x-fruit::badge>', 'badge tone must be one of'],
            ['<x-fruit::badge variant="ghost">New</x-fruit::badge>', 'badge variant must be one of'],
            ['<x-fruit::menu-checkbox aria-checked="true">Previews</x-fruit::menu-checkbox>', 'renders aria-checked from its checked prop'],
            ['<x-fruit::menu-radio checked="yes">Date</x-fruit::menu-radio>', 'checked must be a boolean'],
            ['<x-fruit::menu-radio role="menuitem">Date</x-fruit::menu-radio>', 'overriding role'],
            ['<x-fruit::menu-link>Settings</x-fruit::menu-link>', 'requires href'],
            ['<x-fruit::menu-separator role="presentation" />', 'overriding role'],
            ['<x-fruit::search />', 'needs an accessible name'],
            ['<x-fruit::search label="Find" type="text" />', 'fixed native type'],
            ['<x-fruit::segment type="checkbox">One</x-fruit::segment>', 'fixed native type'],
            ['<x-fruit::presence available="yes" />', 'available must be a boolean'],
            ['<x-fruit::presence data-available="true" />', 'renders data-available'],
            ['<x-fruit::toolbar role="toolbar">Tools</x-fruit::toolbar>', 'overriding role'],
            ['<x-fruit::skeleton lines="0" />', 'skeleton lines must be'],
            ['<x-fruit::divider tone="danger" />', 'divider tone must be'],
            ['<x-fruit::crumb>Customers</x-fruit::crumb>', 'needs an href, or current'],
            ['<x-fruit::crumb href="/" current>Home</x-fruit::crumb>', 'needs an href, or current'],
            ['<x-fruit::breadcrumbs role="list"><li>Home</li></x-fruit::breadcrumbs>', 'overriding role'],
            ['<x-fruit::message layout="bubble">Hi</x-fruit::message>', 'message layout must be'],
            ['<x-fruit::message variant="event">Hi</x-fruit::message>', 'message variant must be'],
            ['<x-fruit::divider align="end" />', 'divider align must be'],
            ['<x-fruit::menu placement="left"><x-fruit::menu-item>Go</x-fruit::menu-item></x-fruit::menu>', 'menu placement must be one of'],
        ];
    }
}
