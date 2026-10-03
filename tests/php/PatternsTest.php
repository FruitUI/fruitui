<?php

namespace FruitUI\Tests;

use DOMDocument;
use DOMXPath;
use FruitUI\FruitUIServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\View\ViewException;
use InvalidArgumentException;
use Orchestra\Testbench\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class PatternsTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [FruitUIServiceProvider::class];
    }

    public function test_conversation_slots_and_action_attributes_reach_the_button_while_checkbox_is_independent(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::item-list aria-label="Conversations" role="list">
                <li><x-fruit::checkbox name="selected[]" value="42" wire:model="selected">Select conversation</x-fruit::checkbox>
                    <x-fruit::item-row variant="filled" type="button" class="custom" aria-current="true" wire:click="open(42)" x-on:click="open" disabled>
                        Sophie Chen
                        <x-slot:leading aria-hidden="true"><span class="f-avatar">SC</span></x-slot:leading>
                        <x-slot:trailing>10:42</x-slot:trailing>
                        <x-slot:subtitle>A fresh start</x-slot:subtitle>
                        <x-slot:preview>A few thoughts…</x-slot:preview>
                        <x-slot:meta>Work mailbox</x-slot:meta>
                    </x-fruit::item-row>
                </li>
            </x-fruit::item-list>
            BLADE);
        $document = $this->document($html);
        $button = $document->getElementsByTagName('button')->item(0);
        $this->assertSame('button', $button->getAttribute('type'));
        $this->assertSame('open(42)', $button->getAttribute('wire:click'));
        $this->assertSame('open', $button->getAttribute('x-on:click'));
        $this->assertSame('true', $button->getAttribute('aria-current'));
        $this->assertTrue($button->hasAttribute('disabled'));
        $this->assertStringContainsString('f-item-row--filled', $button->getAttribute('class'));
        $this->assertStringContainsString('custom', $button->getAttribute('class'));
        $this->assertSame(0, $button->getElementsByTagName('input')->length);
        $input = $document->getElementsByTagName('input')->item(0);
        $this->assertSame('checkbox', $input->getAttribute('type'));
        $this->assertSame('selected', $input->getAttribute('wire:model'));
        $this->assertSame('42', $input->getAttribute('value'));
        $xpath = new DOMXPath($document);
        foreach (['title' => 'Sophie Chen', 'trailing' => '10:42', 'subtitle' => 'A fresh start', 'preview' => 'A few thoughts…', 'meta' => 'Work mailbox'] as $part => $content) {
            $class = $part === 'trailing' ? 'time' : $part;
            $node = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " f-item-row__'.$class.' ")]')->item(0);
            $this->assertSame($content, trim($node->textContent));
        }
        $leading = $xpath->query('//*[@aria-hidden="true"]')->item(0);
        $this->assertStringContainsString('f-item-row__leading', $leading->getAttribute('class'));
        $this->assertSame(1, preg_match_all('/role="list"/', $html));
        $this->assertSame(1, preg_match_all('/type="button"/', $html));
    }

    public function test_patterns_support_native_links_and_independent_recovery_controls(): void
    {
        $html = Blade::render(<<<'BLADE'
            <x-fruit::attachment href="/notes.txt" download="notes.txt" class="custom" aria-label="Download design notes">
                Design notes.txt
                <x-slot:leading aria-hidden="true">File</x-slot:leading>
                <x-slot:detail>Text document</x-slot:detail>
                <x-slot:trailing aria-hidden="true">Download</x-slot:trailing>
            </x-fruit::attachment>
            <x-fruit::empty-state role="region" aria-label="Search results">
                <x-slot:icon aria-hidden="true">Inbox</x-slot:icon>
                <x-slot:title><h2>No conversations</h2></x-slot:title>
                Try another search.
                <x-slot:actions><x-fruit::button wire:click="clearFilters">Clear filters</x-fruit::button></x-slot:actions>
            </x-fruit::empty-state>
            BLADE);
        $document = $this->document($html);
        $link = $document->getElementsByTagName('a')->item(0);
        $this->assertSame('/notes.txt', $link->getAttribute('href'));
        $this->assertSame('notes.txt', $link->getAttribute('download'));
        $this->assertStringContainsString('f-attachment custom', $link->getAttribute('class'));
        $this->assertSame('Text document', trim($link->getElementsByTagName('small')->item(0)->textContent));
        $this->assertSame('Clear filters', trim($document->getElementsByTagName('button')->item(0)->textContent));
        $this->assertSame('clearFilters', $document->getElementsByTagName('button')->item(0)->getAttribute('wire:click'));
        $this->assertSame('No conversations', $document->getElementsByTagName('h2')->item(0)->textContent);
        $this->assertStringContainsString('f-empty-state__actions', $html);
        $this->assertStringContainsString('f-empty-state__description', $html);
    }

    public function test_defaults_and_client_url_bindings_retain_native_semantics(): void
    {
        $html = Blade::render('<x-fruit::item-row>Inbox</x-fruit::item-row><x-fruit::attachment x-bind:href="file.url" download>Notes</x-fruit::attachment>');
        $this->assertStringNotContainsString('f-item-row--filled', $html);
        $this->assertStringContainsString('type="button"', $html);
        $this->assertStringContainsString('x-bind:href="file.url"', $html);
        // A bare download attribute keeps the URL's filename instead of naming every file "download".
        $this->assertStringContainsString('download=""', $html);
    }

    #[DataProvider('invalidPatterns')]
    public function test_patterns_reject_semantic_overrides_and_unknown_variants(string $template): void
    {
        try {
            Blade::render($template);
        } catch (ViewException $exception) {
            $cause = $exception;
            while ($cause->getPrevious()) {
                $cause = $cause->getPrevious();
            }
            $this->assertInstanceOf(InvalidArgumentException::class, $cause);

            return;
        }
        $this->fail('An invalid pattern rendered without an error.');
    }

    public static function invalidPatterns(): array
    {
        return array_map(fn ($template) => [$template], [
            '<x-fruit::item-row variant="checkbox">Inbox</x-fruit::item-row>',
            '<x-fruit::item-row variant="danger">Inbox</x-fruit::item-row>',
            '<x-fruit::item-row type="submit">Inbox</x-fruit::item-row>',
            '<x-fruit::item-row role="checkbox">Inbox</x-fruit::item-row>',
            '<x-fruit::item-row x-bind:type="kind">Inbox</x-fruit::item-row>',
            '<x-fruit::item-row as="a">Inbox</x-fruit::item-row>',
            '<x-fruit::item-list role="listbox" />',
            '<x-fruit::attachment>Notes</x-fruit::attachment>',
            '<x-fruit::attachment href="/notes" role="button">Notes</x-fruit::attachment>',
            '<x-fruit::empty-state role="checkbox">Empty</x-fruit::empty-state>',
        ]);
    }

    private function document(string $html): DOMDocument
    {
        $document = new DOMDocument;
        @$document->loadHTML('<?xml encoding="utf-8" ?>'.$html);

        return $document;
    }
}
