<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;
use PHPUnit\Framework\Attributes\DataProvider;

class LayoutPatternsTest extends TestCase
{
    public function test_structural_adapters_preserve_native_elements_and_independent_controls(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::workspace aria-label="Inbox" class="custom">
                <x-fruit::pane id="content" class="f-pane--column">
                    <x-fruit::description-list><div><dt>Email</dt><dd>sophie@example.com</dd></div></x-fruit::description-list>
                    <x-fruit::table aria-label="Customers"><thead><tr><th scope="col" aria-sort="ascending"><x-fruit::button wire:click="sort">Name</x-fruit::button></th></tr></thead><tbody><tr><td><x-fruit::checkbox name="selected[]" value="42" wire:model="selected">Sophie</x-fruit::checkbox></td></tr></tbody></x-fruit::table>
                </x-fruit::pane>
            </x-fruit::workspace>
            BLADE);
        $document = $this->document($html);
        $this->assertSame('Inbox', $document->getElementsByTagName('section')->item(0)->getAttribute('aria-label'));
        $this->assertStringContainsString('f-workspace custom', $html);
        $this->assertStringContainsString('f-pane f-pane--column', $html);
        $this->assertSame('Email', $document->getElementsByTagName('dt')->item(0)->textContent);
        $this->assertSame('sophie@example.com', $document->getElementsByTagName('dd')->item(0)->textContent);
        $table = $document->getElementsByTagName('table')->item(0);
        $this->assertSame('Customers', $table->getAttribute('aria-label'));
        $this->assertFalse($table->hasAttribute('wire:model'));
        $this->assertSame('ascending', $document->getElementsByTagName('th')->item(0)->getAttribute('aria-sort'));
        $this->assertSame('sort', $document->getElementsByTagName('button')->item(0)->getAttribute('wire:click'));
        $this->assertSame('selected', $document->getElementsByTagName('input')->item(0)->getAttribute('wire:model'));
    }

    public function test_composer_forwards_submit_to_form_and_values_to_textarea(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::composer action="/reply" method="post" wire:submit="send" x-on:submit.prevent="send" aria-label="Reply">
                <label for="reply">Reply</label>
                <x-fruit::textarea id="reply" class="f-composer__input" name="reply" wire:model="draft" x-model="draft" required aria-invalid="true" aria-describedby="reply-error" />
                <p class="f-error" id="reply-error">A reply is required.</p>
                <footer class="f-composer__footer"><x-fruit::button type="submit">Send</x-fruit::button></footer>
            </x-fruit::composer>
            BLADE);
        $document = $this->document($html);
        $form = $document->getElementsByTagName('form')->item(0);
        $this->assertSame('/reply', $form->getAttribute('action'));
        $this->assertSame('post', $form->getAttribute('method'));
        $this->assertSame('send', $form->getAttribute('wire:submit'));
        $this->assertSame('send', $form->getAttribute('x-on:submit.prevent'));
        $this->assertFalse($form->hasAttribute('wire:model'));
        $textarea = $document->getElementsByTagName('textarea')->item(0);
        $this->assertSame('draft', $textarea->getAttribute('wire:model'));
        $this->assertSame('draft', $textarea->getAttribute('x-model'));
        $this->assertSame('reply-error', $textarea->getAttribute('aria-describedby'));
        $this->assertTrue($textarea->hasAttribute('required'));
        $this->assertSame('submit', $document->getElementsByTagName('button')->item(0)->getAttribute('type'));
    }

    public function test_floating_disclosure_keeps_summary_content_and_action_attributes_on_their_elements(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::floating-disclosure placement="above" open x-data="fruitFloatingDisclosure">
                <x-slot:trigger class="f-button" aria-label="Options">Options</x-slot:trigger>
                <x-slot:content class="f-stack"><x-fruit::button wire:click="markAllRead" x-on:click="close(true)">Mark All Read</x-fruit::button></x-slot:content>
            </x-fruit::floating-disclosure>
            BLADE);
        $document = $this->document($html);
        $details = $document->getElementsByTagName('details')->item(0);
        $this->assertTrue($details->hasAttribute('open'));
        $this->assertStringContainsString('f-floating-disclosure--above', $details->getAttribute('class'));
        $this->assertSame('fruitFloatingDisclosure', $details->getAttribute('x-data'));
        $summary = $document->getElementsByTagName('summary')->item(0);
        $this->assertSame('Options', $summary->getAttribute('aria-label'));
        $this->assertSame(0, $summary->getElementsByTagName('button')->length);
        $this->assertStringContainsString('f-floating-disclosure__content f-stack', $html);
        $this->assertSame('markAllRead', $document->getElementsByTagName('button')->item(0)->getAttribute('wire:click'));
        $this->assertSame('close(true)', $document->getElementsByTagName('button')->item(0)->getAttribute('x-on:click'));
        $this->assertSame('More', $this->document(Blade::render('<x-fruit::floating-disclosure title="More">Details</x-fruit::floating-disclosure>'))->getElementsByTagName('summary')->item(0)->textContent);
    }

    public function test_splitter_emits_one_fixed_contract_and_escapes_its_local_helper_config(): void
    {
        $html = Blade::render('<x-fruit::splitter pane="navigation" flexible="content" variable="--f-navigation-width" min="160" max="300" reserve="280" edge="start" role="separator" tabindex="0" aria-orientation="vertical" aria-controls="navigation" aria-label="Navigation" class="custom" />');
        $splitter = $this->document($html)->getElementsByTagName('div')->item(0);
        $this->assertSame('separator', $splitter->getAttribute('role'));
        $this->assertSame('0', $splitter->getAttribute('tabindex'));
        $this->assertSame('vertical', $splitter->getAttribute('aria-orientation'));
        $this->assertSame('navigation', $splitter->getAttribute('aria-controls'));
        $this->assertSame('Navigation', $splitter->getAttribute('aria-label'));
        $this->assertSame('start', $splitter->getAttribute('data-edge'));
        $this->assertStringContainsString('fruitSplitter({', $splitter->getAttribute('x-data'));
        $this->assertStringContainsString('"min":160', $splitter->getAttribute('x-data'));
        $this->assertStringContainsString('"variable":"--f-navigation-width"', $splitter->getAttribute('x-data'));
        foreach (['role', 'tabindex', 'aria-orientation', 'aria-controls', 'x-data'] as $attribute) {
            $this->assertSame(1, preg_match_all('/\b'.preg_quote($attribute, '/').'="/', $html));
        }
        $this->assertFalse($splitter->hasAttribute('data-ready'), 'Without Alpine the CSS hides the inert divider.');
    }

    public function test_drilldown_levels_are_regions_named_by_their_titles_with_back_and_actions(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::workspace aria-label="Settings">
                <x-fruit::drilldown x-data="fruitDrilldown">
                    <x-fruit::drilldown-column title="Mailboxes" optional>
                        <a class="f-form-row f-form-row--link" href="/mailboxes/support" aria-current="page"><span>Support</span></a>
                    </x-fruit::drilldown-column>
                    <x-fruit::drilldown-column title="Connection" id="mailbox-connection" wire:key="connection">
                        <x-slot:back><x-fruit::back-link href="/mailboxes/support" wire:navigate>Support</x-fruit::back-link></x-slot:back>
                        <x-slot:actions class="custom"><x-fruit::button size="small" wire:click="test">Test</x-fruit::button></x-slot:actions>
                        <x-fruit::input name="host" wire:model.live.blur="host" />
                    </x-fruit::drilldown-column>
                </x-fruit::drilldown>
            </x-fruit::workspace>
            BLADE);
        $document = $this->document($html);
        $xpath = new \DOMXPath($document);
        $this->assertSame('fruitDrilldown', $xpath->query('//div[contains(@class, "f-drilldown")]')->item(0)->getAttribute('x-data'));
        [$list, $page] = iterator_to_array($xpath->query('//section[contains(@class, "f-drilldown__column")]'));
        // Each level is named by its h2 title, with ids rendered by the server so a morph keeps them.
        $this->assertSame('f-drilldown__column f-drilldown__column--optional', $list->getAttribute('class'));
        $this->assertSame('f-level-mailboxes-title', $list->getAttribute('aria-labelledby'));
        $this->assertSame('mailbox-connection-title', $page->getAttribute('aria-labelledby'));
        $title = $document->getElementById('mailbox-connection-title');
        $this->assertSame(['h2', 'Connection', '-1'], [$title->tagName, $title->textContent, $title->getAttribute('tabindex')]);
        $this->assertSame('connection', $page->getAttribute('wire:key'));
        // The title row: the Back Link first, then the title, then the actions.
        $header = $xpath->query('.//header[@class="f-drilldown__header"]', $page)->item(0);
        $children = array_values(array_filter(iterator_to_array($header->childNodes), fn ($node) => $node instanceof \DOMElement));
        $this->assertSame(['a', 'h2', 'div'], array_map(fn ($node) => $node->tagName, $children));
        $this->assertSame('/mailboxes/support', $children[0]->getAttribute('href'));
        $this->assertSame('f-drilldown__actions custom', $children[2]->getAttribute('class'));
        $this->assertSame('test', $xpath->query('.//button', $children[2])->item(0)->getAttribute('wire:click'));
        // The content scrolls on its own, and its controls keep their bindings.
        $scroll = $xpath->query('./div[@class="f-pane__scroll"]', $page)->item(0);
        $this->assertSame('host', $xpath->query('.//input', $scroll)->item(0)->getAttribute('wire:model.live.blur'));
        $this->assertSame(0, $xpath->query('.//header', $list)->item(0)->getElementsByTagName('a')->length);
    }

    #[DataProvider('invalidLayouts')]
    public function test_new_adapters_reject_semantic_overrides_and_invalid_width_options(string $template): void
    {
        $this->assertRejected($template);
    }

    public static function invalidLayouts(): array
    {
        $splitter = '<x-fruit::splitter pane="nav" flexible="content" variable="--f-width" ';

        return array_map(fn ($template) => [$template], [
            '<x-fruit::workspace role="listbox" />', '<x-fruit::pane as="button" />',
            '<x-fruit::composer role="textbox" />', '<x-fruit::description-list role="listbox" />',
            '<x-fruit::table role="grid" />', '<x-fruit::table x-bind:role="role" />',
            '<x-fruit::floating-disclosure placement="menu" />', '<x-fruit::floating-disclosure role="menu" />',
            $splitter.'min="0" />', $splitter.'min="300" max="200" />', $splitter.'reserve="-1" />',
            $splitter.'edge="top" />', $splitter.'role="slider" />', $splitter.'aria-orientation="horizontal" />',
            $splitter.'tabindex="-1" />', $splitter.'x-bind:tabindex.camel="index" />', $splitter.'x-bind:aria-controls="pane" />', $splitter.'x-data="other" />', $splitter.'x-bind:role="role" />',
            '<x-fruit::splitter pane="nav" flexible="nav" variable="width" />',
            '<x-fruit::drilldown role="navigation" />', '<x-fruit::drilldown as="nav" />',
            '<x-fruit::drilldown-column />', '<x-fruit::drilldown-column title=" " />',
            '<x-fruit::drilldown-column title="Mailboxes" optional="yes" />', '<x-fruit::drilldown-column title="Mailboxes" role="dialog" />',
        ]);
    }
}
