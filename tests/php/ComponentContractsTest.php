<?php

namespace FruitUI\Tests;

use FruitUI\Fruit;
use Illuminate\Support\Facades\Blade;
use PHPUnit\Framework\Attributes\DataProvider;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ComponentContractsTest extends TestCase
{
    #[DataProvider('textTypes')]
    public function test_text_input_accepts_only_documented_subtypes(string $type): void
    {
        $html = Blade::render('<x-fruit::input :type="$type" name="message" value="Hello" aria-label="Message" x-model="message" wire:model.live="message" />', compact('type'));
        $input = $this->document($html)->getElementsByTagName('input')->item(0);
        $this->assertSame($type, $input->getAttribute('type'));
        $this->assertSame('message', $input->getAttribute('name'));
        $this->assertSame('Hello', $input->getAttribute('value'));
        $this->assertSame('message', $input->getAttribute('x-model'));
        $this->assertSame('message', $input->getAttribute('wire:model.live'));
    }

    public static function textTypes(): array
    {
        return array_map(fn ($type) => [$type], ['text', 'email', 'password', 'search', 'tel', 'url']);
    }

    #[DataProvider('invalidTypes')]
    public function test_other_control_families_cannot_be_rendered_as_text_input(mixed $type): void
    {
        $this->assertRejected('<x-fruit::input :type="$type" />', 'Use checkbox, radio, or switch', compact('type'));
    }

    public static function invalidTypes(): array
    {
        return array_map(fn ($type) => [$type], ['checkbox', 'radio', 'number', 'range', 'date', 'file', 'hidden', 'button', 'unknown', false, ['text']]);
    }

    #[DataProvider('buttonVariants')]
    public function test_supported_button_variants_keep_the_same_native_contract(string $variant): void
    {
        $html = Blade::render('<x-fruit::button :variant="$variant" type="submit" name="action" value="save" wire:click="save">Save</x-fruit::button>', compact('variant'));
        $button = $this->document($html)->getElementsByTagName('button')->item(0);
        $this->assertSame('submit', $button->getAttribute('type'));
        $this->assertSame('save', $button->getAttribute('value'));
        $this->assertSame('save', $button->getAttribute('wire:click'));
        $this->assertStringContainsString('f-button', $button->getAttribute('class'));
        if ($variant !== 'default') {
            $this->assertStringContainsString('f-button--'.$variant, $button->getAttribute('class'));
        }
    }

    public static function buttonVariants(): array
    {
        return array_map(fn ($variant) => [$variant], ['default', 'primary', 'ghost', 'danger']);
    }

    #[DataProvider('choices')]
    public function test_choice_components_own_their_control_and_forward_form_and_adapter_attributes(string $component, string $type): void
    {
        $html = Blade::render('<x-fruit::'.$component.' type="'.$type.'" role="'.$component.'" id="choice" name="choice" value="compact" checked disabled required x-model="choice" wire:model.live="choice" aria-describedby="choice-help">Compact</x-fruit::'.$component.'>');
        $document = $this->document($html);
        $input = $document->getElementsByTagName('input')->item(0);
        $this->assertSame($type, $input->getAttribute('type'));
        $this->assertSame($component, $input->getAttribute('role'));
        $this->assertSame('label', $input->parentNode->nodeName);
        $this->assertSame('Compact', trim($input->parentNode->textContent));
        foreach (['id' => 'choice', 'name' => 'choice', 'value' => 'compact', 'x-model' => 'choice', 'wire:model.live' => 'choice', 'aria-describedby' => 'choice-help'] as $attribute => $value) {
            $this->assertSame($value, $input->getAttribute($attribute));
            $this->assertFalse($input->parentNode->hasAttribute($attribute));
        }
        foreach (['checked', 'disabled', 'required'] as $attribute) {
            $this->assertTrue($input->hasAttribute($attribute));
        }
        $this->assertSame(1, preg_match_all('/\btype="/', $html));
        $this->assertSame(1, preg_match_all('/\brole="/', $html));
    }

    public static function choices(): array
    {
        return [['checkbox', 'checkbox'], ['radio', 'radio'], ['switch', 'checkbox']];
    }

    #[DataProvider('invalidContracts')]
    public function test_options_and_attributes_cannot_change_a_components_semantic_purpose(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function invalidContracts(): array
    {
        return [
            ['<x-fruit::button variant="red">Go</x-fruit::button>', 'button variant must be one of'],
            ['<x-fruit::button type="checkbox">Go</x-fruit::button>', 'button type must be one of'],
            ['<x-fruit::button role="checkbox">Go</x-fruit::button>', 'overriding role'],
            ['<x-fruit::input role="checkbox" />', 'overriding role'],
            ['<x-fruit::input as="select" />', 'fixed native element'],
            ['<x-fruit::input x-bind:type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::input ::type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::input type="email" x-bind:type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::checkbox type="radio">Choice</x-fruit::checkbox>', 'fixed native type'],
            ['<x-fruit::radio role="checkbox">Choice</x-fruit::radio>', 'overriding role'],
            ['<x-fruit::switch role="checkbox">Setting</x-fruit::switch>', 'overriding role'],
            ['<x-fruit::switch x-bind:role.camel="kind">Setting</x-fruit::switch>', 'type and role belong to its component contract'],
            ['<x-fruit::select role="checkbox"><option>A</option></x-fruit::select>', 'overriding role'],
            ['<x-fruit::textarea role="listbox" />', 'overriding role'],
            ['<x-fruit::dialog role="checkbox" />', 'overriding role'],
            ['<x-fruit::disclosure title="More" as="button">Details</x-fruit::disclosure>', 'fixed native element'],
            ['<x-fruit::card role="checkbox">A row</x-fruit::card>', 'overriding role'],
            ['<x-fruit::card as="button">An action</x-fruit::card>', 'fixed native element'],
        ];
    }

    public function test_a_password_input_can_bind_its_type_to_reveal_its_characters(): void
    {
        // Blade escapes ::type to Alpine's :type shorthand.
        foreach (['x-bind:type' => 'x-bind:type', '::type' => ':type'] as $binding => $rendered) {
            $html = Blade::render('<x-fruit::input type="password" name="password" autocomplete="current-password" '.$binding.'="shown ? \'text\' : \'password\'" wire:model="password" />');
            $input = $this->document($html)->getElementsByTagName('input')->item(0);

            $this->assertSame('password', $input->getAttribute('type'));
            $this->assertSame("shown ? 'text' : 'password'", $input->getAttribute($rendered));
            $this->assertSame('password', $input->getAttribute('wire:model'));
        }

        // The documented reveal toggle: Field still labels the input inside an input group.
        $html = Blade::render(<<<'BLADE'
            <x-fruit::field label="Password" x-data="{ shown: false }">
                <div class="f-input-group">
                    <x-fruit::input type="password" wire:model="password" autocomplete="current-password" x-bind:type="shown ? 'text' : 'password'" />
                    <x-fruit::button type="button" x-on:click="shown = !shown" x-bind:aria-pressed="shown">Show</x-fruit::button>
                </div>
            </x-fruit::field>
            BLADE);
        $input = $this->document($html)->getElementsByTagName('input')->item(0);
        $this->assertSame('field-password', $input->getAttribute('id'));
        $this->assertStringContainsString('for="field-password"', $html);
    }

    public function test_choices_carry_a_description_linked_to_the_control_but_not_its_name(): void
    {
        foreach (['checkbox', 'radio', 'switch'] as $component) {
            $xpath = $this->xpath(Blade::render('<x-fruit::'.$component.' name="photos" value="1" wire:model="photos" description="From Gravatar, for customers without a photo.">Customer Photos</x-fruit::'.$component.'>'));
            $input = $xpath->query('//input')->item(0);
            $description = $xpath->query('//div[@class="f-choice"]/p[contains(@class, "f-choice__description")]')->item(0);
            $this->assertNotNull($description, $component);
            $this->assertSame('From Gravatar, for customers without a photo.', trim($description->textContent));
            $this->assertSame($description->getAttribute('id'), $input->getAttribute('aria-describedby'));
            // The label (the accessible name) holds only the title.
            $this->assertSame('Customer Photos', trim($xpath->query('//label')->item(0)->textContent));
            $this->assertSame('photos', $input->getAttribute('wire:model'));
        }

        // Without a description the markup is unchanged.
        $plain = $this->xpath(Blade::render('<x-fruit::checkbox name="tags">Manage tags</x-fruit::checkbox>'));
        $this->assertSame(0, $plain->query('//div')->length);
        $this->assertFalse($plain->query('//input')->item(0)->hasAttribute('aria-describedby'));

        // Inside a Field the description joins the Field's own description; radios in one group stay distinct.
        $field = $this->xpath(Blade::render('<x-fruit::field label="Photos" description="Shown in conversations."><x-fruit::switch name="photos" description="From Gravatar.">Customer Photos</x-fruit::switch></x-fruit::field>'));
        $described = explode(' ', $field->query('//input')->item(0)->getAttribute('aria-describedby'));
        $this->assertCount(2, $described);
        $this->assertSame('Shown in conversations.', trim($field->query('//*[@id="'.$described[0].'"]')->item(0)->textContent));
        $this->assertSame('From Gravatar.', trim($field->query('//*[@id="'.$described[1].'"]')->item(0)->textContent));
        $radios = $this->xpath(Blade::render('<x-fruit::radio name="plan" value="team" description="Up to 50 people.">Team</x-fruit::radio><x-fruit::radio name="plan" value="studio" description="Up to 50 people.">Studio</x-fruit::radio>'));
        $ids = array_map(fn ($node) => $node->getAttribute('id'), iterator_to_array($radios->query('//p')));
        $this->assertCount(2, array_unique($ids));

        // A named slot can hold rich text, such as a link.
        $slot = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::checkbox name="terms">
                I agree
                <x-slot:description>Read the <a href="/terms">terms</a>.</x-slot:description>
            </x-fruit::checkbox>
            BLADE));
        $this->assertSame('/terms', $slot->query('//p/a')->item(0)->getAttribute('href'));
    }

    public function test_form_sections_group_row_fields_under_a_named_heading(): void
    {
        $xpath = $this->xpath(Blade::render(<<<'BLADE'
            <x-fruit::form-section title="Automatic Reply" footer="Sent once per conversation." :level="3">
                <x-fruit::field label="Subject" layout="row" description="Shown in the customer's inbox.">
                    <x-fruit::input wire:model="settings.subject" />
                </x-fruit::field>
                <x-fruit::field label="Send automatically" layout="row">
                    <x-fruit::switch wire:model="settings.enabled" />
                </x-fruit::field>
            </x-fruit::form-section>
            BLADE));
        $section = $xpath->query('//section')->item(0);
        $heading = $xpath->query('//h3[@class="f-form-section__title"]')->item(0);
        $this->assertSame('f-form-section', $section->getAttribute('class'));
        $this->assertSame('f-section-automatic-reply-title', $heading->getAttribute('id'));
        $this->assertSame($heading->getAttribute('id'), $section->getAttribute('aria-labelledby'));
        $this->assertSame('Sent once per conversation.', trim($xpath->query('//p[@class="f-form-section__footer"]')->item(0)->textContent));
        $rows = $xpath->query('//div[@class="f-form-section__rows"]/div[contains(@class, "f-field--row")]');
        $this->assertSame(2, $rows->length);
        // Row fields keep Field's associations: the label names the control and the help describes it.
        $subject = $xpath->query('.//input', $rows->item(0))->item(0);
        $this->assertSame('field-settings-subject', $subject->getAttribute('id'));
        $this->assertSame('field-settings-subject-description', $subject->getAttribute('aria-describedby'));
        $switch = $xpath->query('.//input[@role="switch"]', $rows->item(1))->item(0);
        $this->assertSame($switch->getAttribute('id'), $xpath->query('.//label[@class="f-label"]', $rows->item(1))->item(0)->getAttribute('for'));

        // Without a title there is no heading or label; without a footer, no footer.
        $plain = $this->xpath(Blade::render('<x-fruit::form-section><div class="f-form-row">Row</div></x-fruit::form-section>'));
        $this->assertSame(0, $plain->query('//h2|//h3|//h4|//p')->length);
        $this->assertFalse($plain->query('//section')->item(0)->hasAttribute('aria-labelledby'));

        $this->assertRejected('<x-fruit::form-section title="A" level="1">Row</x-fruit::form-section>', 'form-section level must be one of');
        $this->assertRejected('<x-fruit::form-section role="list">Row</x-fruit::form-section>', 'overriding role');
        $this->assertRejected('<x-fruit::field label="A" layout="grid"><x-fruit::input name="a" /></x-fruit::field>', 'Field layout must be one of');

        $inline = $this->xpath(Blade::render('<x-fruit::field label="Cc" layout="inline"><x-fruit::token-field name="cc" /><x-fruit::button variant="ghost" size="small">Bcc</x-fruit::button></x-fruit::field>'));
        $field = $inline->query('//div[contains(@class, "f-field--inline")]')->item(0);
        $this->assertSame('f-field f-field--inline', $field->getAttribute('class'));
        $this->assertSame('field-cc', $inline->query('//label')->item(0)->getAttribute('for'));
        $this->assertSame('field-cc', $inline->query('//textarea')->item(0)->getAttribute('id'));
    }

    public function test_item_links_and_fill_workspaces_keep_their_contracts(): void
    {
        $link = $this->xpath(Blade::render('<x-fruit::item-link href="/conversations/41" target="_blank" current wire:navigate>Jordan Lee<x-slot:subtitle>Sign-in</x-slot:subtitle></x-fruit::item-link>'))->query('//a')->item(0);
        $this->assertSame('/conversations/41', $link->getAttribute('href'));
        $this->assertSame('_blank', $link->getAttribute('target'));
        $this->assertSame('page', $link->getAttribute('aria-current'));
        $this->assertSame('f-item-row', $link->getAttribute('class'));
        $this->assertFalse($this->xpath(Blade::render('<x-fruit::item-link href="/a">A</x-fruit::item-link>'))->query('//a')->item(0)->hasAttribute('aria-current'));
        $this->assertRejected('<x-fruit::item-link>Missing</x-fruit::item-link>', 'requires href');
        $this->assertRejected('<x-fruit::item-link href="/a" role="button">A</x-fruit::item-link>', 'overriding role');

        $this->assertStringContainsString('class="f-workspace f-workspace--fill"', Blade::render('<x-fruit::workspace frame="fill" aria-label="App">Panes</x-fruit::workspace>'));
        $this->assertStringContainsString('class="f-workspace"', Blade::render('<x-fruit::workspace aria-label="App">Panes</x-fruit::workspace>'));
        $this->assertRejected('<x-fruit::workspace frame="window">Panes</x-fruit::workspace>', 'workspace frame must be one of');
    }

    public function test_marks_name_what_a_row_or_sidebar_item_belongs_to(): void
    {
        $row = $this->xpath(Blade::render('<x-fruit::item-row mark="green" mark-label="Billing mailbox">Sophie Chen</x-fruit::item-row>'));
        $this->assertSame('green', $row->query('//button')->item(0)->getAttribute('data-fruit-mark'));
        $this->assertSame('Billing mailbox', $row->query('//button/span[@class="f-sr-only"]')->item(0)->textContent);

        $link = $this->xpath(Blade::render('<x-fruit::item-link href="/conversations/41" mark="purple" mark-label="Feedback mailbox">Jordan Lee</x-fruit::item-link>'));
        $this->assertSame('purple', $link->query('//a')->item(0)->getAttribute('data-fruit-mark'));
        $this->assertSame('Feedback mailbox', $link->query('//a/span[@class="f-sr-only"]')->item(0)->textContent);

        // Without a mark a row renders neither the attribute nor the label.
        $plain = $this->xpath(Blade::render('<x-fruit::item-row>Sophie Chen</x-fruit::item-row>'));
        $this->assertFalse($plain->query('//button')->item(0)->hasAttribute('data-fruit-mark'));
        $this->assertSame(0, $plain->query('//span[@class="f-sr-only"]')->length);

        // A sidebar item and group summary name themselves, so their mark needs no label.
        $item = $this->xpath(Blade::render('<x-fruit::sidebar-item href="/support" mark="blue">Support</x-fruit::sidebar-item>'));
        $this->assertSame('blue', $item->query('//a')->item(0)->getAttribute('data-fruit-mark'));
        $group = $this->xpath(Blade::render('<x-fruit::sidebar-group title="Billing" mark="green"><x-fruit::sidebar-item href="/billing">Open</x-fruit::sidebar-item></x-fruit::sidebar-group>'));
        $this->assertSame('green', $group->query('//summary')->item(0)->getAttribute('data-fruit-mark'));
        $this->assertFalse($group->query('//details')->item(0)->hasAttribute('data-fruit-mark'));
        $this->assertFalse($this->xpath(Blade::render('<x-fruit::sidebar-group title="Work">A</x-fruit::sidebar-group>'))->query('//summary')->item(0)->hasAttribute('data-fruit-mark'));

        $this->assertRejected('<x-fruit::item-row mark="teal" mark-label="Billing mailbox">A</x-fruit::item-row>', 'mark must be one of');
        $this->assertRejected('<x-fruit::item-row mark="green">A</x-fruit::item-row>', 'needs a mark-label');
        $this->assertRejected('<x-fruit::item-link href="/a" mark="green" mark-label=" ">A</x-fruit::item-link>', 'needs a mark-label');
        $this->assertRejected('<x-fruit::sidebar-item href="/a" mark="#ff0000">A</x-fruit::sidebar-item>', 'mark must be one of');
        $this->assertRejected('<x-fruit::sidebar-group title="A" mark="Blue">A</x-fruit::sidebar-group>', 'mark must be one of');
    }

    public function test_the_editor_paste_mode_is_an_explicit_option(): void
    {
        $this->assertStringContainsString('data-fruit-paste="plain"', Blade::render('<x-fruit::editor name="body" paste="plain" />'));
        $this->assertStringContainsString('data-fruit-paste="rich"', Blade::render('<x-fruit::editor name="body" />'));
        $this->assertRejected('<x-fruit::editor name="body" paste="markdown" />', 'editor paste must be one of');
        // A channel's formats: only those commands, plus Remove Formatting, Undo and Redo.
        $limited = $this->xpath(Blade::render('<x-fruit::editor name="body" :formats="[\'bold\', \'link\']" />'));
        $this->assertSame('bold link', $limited->query('//div[contains(@class, "f-editor")]')->item(0)->getAttribute('data-fruit-formats'));
        $this->assertSame(['bold', 'link', 'clear', 'undo', 'redo'], array_map(fn ($button) => $button->getAttribute('data-fruit-command'), iterator_to_array($limited->query('//button[@data-fruit-command]'))));
        $this->assertSame(2, $limited->query('//span[@class="f-editor__separator"]')->length);
        $plain = $this->xpath(Blade::render('<x-fruit::editor name="body" :formats="[]" />'));
        $this->assertSame('', $plain->query('//div[contains(@class, "f-editor")]')->item(0)->getAttribute('data-fruit-formats'));
        $this->assertSame(['undo', 'redo'], array_map(fn ($button) => $button->getAttribute('data-fruit-command'), iterator_to_array($plain->query('//button[@data-fruit-command]'))));
        $this->assertStringNotContainsString('data-fruit-formats', Blade::render('<x-fruit::editor name="body" />'));
        $this->assertRejected('<x-fruit::editor name="body" :formats="[\'bold\', \'heading\']" />', 'editor formats must be a list of');
        $this->assertRejected('<x-fruit::editor name="body" formats="bold" />', 'editor formats must be a list of');
        // Inline: a chat's field, the formatting bar on demand, the application's buttons in the line.
        $inline = $this->xpath(Blade::render('<x-fruit::editor id="chat" name="body" layout="inline" enter="submit" :formats="[\'bold\']"><x-slot:extras><button type="button">Attach</button></x-slot:extras></x-fruit::editor>'));
        $root = $inline->query('//div[contains(@class, "f-editor")]')->item(0);
        $this->assertSame('f-editor f-editor--inline', $root->getAttribute('class'));
        $this->assertSame('submit', $root->getAttribute('data-fruit-enter'));
        $this->assertSame('1', $inline->query('//textarea')->item(0)->getAttribute('rows'));
        $toggle = $inline->query('//div[@class="f-editor__actions"]/button[@data-fruit-formatting]')->item(0);
        $this->assertSame('chat-formatting', $toggle->getAttribute('aria-controls'));
        $this->assertSame('false', $toggle->getAttribute('aria-expanded'));
        $this->assertSame('chat-formatting', $inline->query('//div[@class="f-editor__toolbar"]')->item(0)->getAttribute('id'));
        $this->assertSame('Attach', $inline->query('//div[@class="f-editor__actions"]/button[not(@data-fruit-formatting)]')->item(0)->textContent);
        $this->assertSame(0, $inline->query('//div[@class="f-editor__toolbar"]//button[text()="Attach"]')->length);
        $plain = $this->xpath(Blade::render('<x-fruit::editor name="body" layout="inline" :formats="[]" />'));
        $this->assertSame(0, $plain->query('//button[@data-fruit-formatting]')->length);
        $this->assertSame('newline', $this->xpath(Blade::render('<x-fruit::editor name="body" />'))->query('//div[contains(@class, "f-editor")]')->item(0)->getAttribute('data-fruit-enter'));
        $this->assertRejected('<x-fruit::editor name="body" layout="chat" />', 'editor layout must be one of');
        $this->assertRejected('<x-fruit::editor name="body" enter="send" />', 'editor enter must be one of');
    }

    public function test_threads_list_messages_that_name_their_direction(): void
    {
        $list = $this->xpath(Blade::render('<x-fruit::thread aria-label="Messages"><li>A</li></x-fruit::thread>'))->query('//ol')->item(0);
        $this->assertSame('list', $list->getAttribute('role'));
        $this->assertSame('f-thread', $list->getAttribute('class'));
        $this->assertSame('Messages', $list->getAttribute('aria-label'));
        $this->assertRejected('<x-fruit::thread role="feed">A</x-fruit::thread>', 'overriding role');
        // A chat is a compact thread; the density is an explicit, small choice.
        $compact = $this->xpath(Blade::render('<x-fruit::thread density="compact" class="extra"><li>A</li></x-fruit::thread>'))->query('//ol')->item(0);
        $this->assertSame('f-thread f-thread--compact extra', $compact->getAttribute('class'));
        $this->assertSame('f-thread', $this->xpath(Blade::render('<x-fruit::thread density="comfortable"><li>A</li></x-fruit::thread>'))->query('//ol')->item(0)->getAttribute('class'));
        $this->assertRejected('<x-fruit::thread density="chat"><li>A</li></x-fruit::thread>', 'density must be one of');
        // A run of messages from one person: the later ones are continued, keeping their author for screen readers.
        $continued = Blade::render('<x-fruit::message continued aria-label="Message from Mia">Second<x-slot:author>Mia</x-slot:author><x-slot:time>9:13 AM</x-slot:time></x-fruit::message>');
        $this->assertStringContainsString('class="f-message f-message--continued"', $continued);
        $this->assertStringContainsString('<strong class="f-message__author">Mia</strong>', $continued);
        $this->assertRejected('<x-fruit::message continued variant="note" aria-label="Note">A</x-fruit::message>', 'notes and generated text keep their own header');
        $this->assertRejected('<x-fruit::message :continued="1" aria-label="A">A</x-fruit::message>', 'continued must be a boolean');

        $this->assertStringContainsString('class="f-message f-message--stacked f-message--outgoing"', Blade::render('<x-fruit::message layout="stacked" direction="outgoing" aria-label="Reply">Yes</x-fruit::message>'));
        $this->assertStringContainsString('class="f-message"', Blade::render('<x-fruit::message direction="incoming" aria-label="Question">Hi</x-fruit::message>'));
        $this->assertRejected('<x-fruit::message direction="sent">Yes</x-fruit::message>', 'message direction must be one of');
        $this->assertStringContainsString('class="f-message f-message--stacked f-message--outgoing f-message--mine"', Blade::render('<x-fruit::message layout="stacked" direction="outgoing" mine aria-label="Your reply">Done</x-fruit::message>'));
        $this->assertStringContainsString('class="f-message f-message--stacked f-message--generated"', Blade::render('<x-fruit::message layout="stacked" variant="generated" aria-label="Summary">Short</x-fruit::message>'));
        $this->assertRejected('<x-fruit::message mine aria-label="Question">Hi</x-fruit::message>', 'use it with direction="outgoing"');
        $this->assertRejected('<x-fruit::message variant="ai">Hi</x-fruit::message>', 'message variant must be one of');

        app()->setLocale('nl');
        $xpath = $this->xpath(Blade::render('<x-fruit::message layout="stacked" lang="da" aria-label="Emma">Hej<x-slot:translation lang="en">Hi</x-slot:translation></x-fruit::message>'));
        $translation = $xpath->query('//div[@class="f-message__translation"]')->item(0);
        $this->assertSame('en', $translation->getAttribute('lang'));
        $this->assertSame('Vertaling', $xpath->query('.//span[@class="f-sr-only"]', $translation)->item(0)->textContent);
        $this->assertSame('Hi', $xpath->query('.//div[@class="f-message__translation-text"]', $translation)->item(0)->textContent);
        $this->assertSame('true', $xpath->query('.//svg', $translation)->item(0)->getAttribute('aria-hidden'));
        // Read first: the translation comes before the original text.
        $this->assertSame('f-message__body', $xpath->query('following-sibling::div[1]', $translation)->item(0)->getAttribute('class'));

        $this->assertStringContainsString('class="f-composer f-composer--top"', Blade::render('<x-fruit::composer placement="top" aria-label="Reply">Reply</x-fruit::composer>'));
        $this->assertRejected('<x-fruit::composer placement="side">Reply</x-fruit::composer>', 'composer placement must be one of');
    }

    public function test_a_field_label_can_be_a_slot_with_markup(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::field layout="row"><x-slot:label>Type <strong>DELETE</strong> to confirm</x-slot:label><x-fruit::input name="confirmation" /></x-fruit::field>'));
        $label = $xpath->query('//label')->item(0);
        $this->assertSame('field-confirmation', $label->getAttribute('for'));
        $this->assertSame('Type DELETE to confirm', $label->textContent);
        $this->assertSame('DELETE', $xpath->query('//label/strong')->item(0)->textContent);
        $this->assertSame('field-confirmation', $xpath->query('//input')->item(0)->getAttribute('id'));

        $this->assertRejected('<x-fruit::field><x-fruit::input name="a" /></x-fruit::field>', 'requires a nonempty label');
        $this->assertRejected('<x-fruit::field><x-slot:label> <span></span> </x-slot:label><x-fruit::input name="a" /></x-fruit::field>', 'requires a nonempty label');
        $this->assertRejected('<x-fruit::field label=" "><x-fruit::input name="a" /></x-fruit::field>', 'requires a nonempty label');
    }

    public function test_a_list_header_holds_tools_and_the_selection_bar_for_a_selectable_list(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::list-header><x-slot:leading><input type="checkbox" aria-label="Select all"></x-slot:leading><span>Newest First</span><x-slot:selection><x-fruit::selection-bar :count="2"><x-fruit::button>Close</x-fruit::button></x-fruit::selection-bar></x-slot:selection></x-fruit::list-header>'));
        $header = $xpath->query('//div[@class="f-list-header"]')->item(0);
        $this->assertSame(['f-list-header__leading', 'f-list-header__tools', 'f-selection-bar'], array_map(fn ($node) => $node->getAttribute('class'), iterator_to_array($xpath->query('./div', $header))));
        $this->assertSame('2 selected', $xpath->query('.//span[@role="status"]', $header)->item(0)->textContent);

        $list = $this->xpath(Blade::render('<x-fruit::item-list id="tickets" selection="multiple"><li>A</li></x-fruit::item-list>'))->query('//ul')->item(0);
        $this->assertSame('multiple', $list->getAttribute('data-fruit-selection'));
        $this->assertSame('fruitListSelection', $list->getAttribute('x-data'));
        $plain = $this->xpath(Blade::render('<x-fruit::item-list x-data="{ starred: false }"><li>A</li></x-fruit::item-list>'))->query('//ul')->item(0);
        $this->assertFalse($plain->hasAttribute('data-fruit-selection'));
        $this->assertSame('{ starred: false }', $plain->getAttribute('x-data'));
        $this->assertRejected('<x-fruit::item-list selection="single"><li>A</li></x-fruit::item-list>', 'item-list selection must be one of');
        $this->assertRejected('<x-fruit::item-list selection="multiple" x-data="{}"><li>A</li></x-fruit::item-list>', 'owns its fruitListSelection helper');
        $this->assertRejected('<x-fruit::list-header role="toolbar">Tools</x-fruit::list-header>', 'overriding role');
    }

    public function test_a_segmented_control_can_name_its_group_for_assistive_technology_only(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::segmented legend="Conversation Type" legend-hidden><x-fruit::segment name="type" value="email" checked>Email</x-fruit::segment></x-fruit::segmented>'));
        $legend = $xpath->query('//legend')->item(0);
        $this->assertSame('Conversation Type', $legend->textContent);
        $this->assertSame('f-sr-only', $legend->getAttribute('class'));
        $this->assertFalse($this->xpath(Blade::render('<x-fruit::segmented legend="Type"><x-fruit::segment name="t" value="a">A</x-fruit::segment></x-fruit::segmented>'))->query('//legend')->item(0)->hasAttribute('class'));
        $this->assertRejected('<x-fruit::segmented legend="Type" legend-hidden="yes">A</x-fruit::segmented>', 'legend-hidden must be a boolean');
    }

    public function test_generated_text_is_compact_and_named_for_assistive_technology(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::generated label="Summary">Moved to the Team plan.</x-fruit::generated>'));
        $root = $xpath->query('//div[@class="f-generated"]')->item(0);
        $this->assertSame('Summary', $xpath->query('.//span[@class="f-sr-only"]', $root)->item(0)->textContent);
        $this->assertSame('true', $xpath->query('.//svg', $root)->item(0)->getAttribute('aria-hidden'));
        $this->assertSame('Moved to the Team plan.', trim($xpath->query('.//div[@class="f-generated__text"]', $root)->item(0)->textContent));
        app()->setLocale('nl');
        $this->assertStringContainsString('<span class="f-sr-only">Gegenereerd</span>', Blade::render('<x-fruit::generated>Tekst</x-fruit::generated>'));
        $this->assertRejected('<x-fruit::generated label=" ">Text</x-fruit::generated>', 'needs a nonempty label');
        $this->assertRejected('<x-fruit::generated role="article">Text</x-fruit::generated>', 'overriding role');
    }

    public function test_a_message_status_is_one_line_and_attachments_can_carry_actions(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::message layout="stacked" direction="outgoing" mine aria-label="Reply">Body<x-slot:status tone="danger">Not sent. <button type="button">Retry</button></x-slot:status></x-fruit::message>'));
        $status = $xpath->query('//div[contains(@class, "f-message__status")]')->item(0);
        $this->assertSame('danger', $status->getAttribute('data-tone'));
        $this->assertFalse($status->hasAttribute('tone'));
        $this->assertSame('true', $xpath->query('.//svg', $status)->item(0)->getAttribute('aria-hidden'));
        $this->assertSame('Retry', $xpath->query('.//button', $status)->item(0)->textContent);
        // The status sits before the body, under the header.
        $this->assertSame('f-message__body', $xpath->query('following-sibling::div[1]', $status)->item(0)->getAttribute('class'));
        $this->assertSame('neutral', $this->xpath(Blade::render('<x-fruit::message aria-label="A">B<x-slot:status>Draft</x-slot:status></x-fruit::message>'))->query('//div[contains(@class, "f-message__status")]')->item(0)->getAttribute('data-tone'));
        $this->assertRejected('<x-fruit::message aria-label="A">B<x-slot:status tone="error">Failed</x-slot:status></x-fruit::message>', 'message status tone must be one of');

        app()->setLocale('nl');
        $attachment = $this->xpath(Blade::render('<x-fruit::attachment href="/a.txt">a.txt<x-slot:actions><button type="button" aria-label="Remove a.txt">x</button></x-slot:actions></x-fruit::attachment>'));
        $frame = $attachment->query('//span[@class="f-attachment__frame"]')->item(0);
        $this->assertSame('/a.txt', $attachment->query('./a[@class="f-attachment"]', $frame)->item(0)->getAttribute('href'));
        $actions = $attachment->query('./span[@role="group"]', $frame)->item(0);
        $this->assertSame('Bijlageacties', $actions->getAttribute('aria-label'));
        $this->assertSame(0, $this->xpath(Blade::render('<x-fruit::attachment href="/a.txt">a.txt</x-fruit::attachment>'))->query('//span[@class="f-attachment__frame"]')->length);
    }

    public function test_a_suggestion_is_a_named_region_with_status_translation_and_actions(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::suggestion title="AI draft" meta="English · High" aria-busy="true"><p>Hi</p><x-slot:status tone="working">Drafting…</x-slot:status><x-slot:translation lang="nl"><p>Hoi</p></x-slot:translation><x-slot:actions><button type="button">Insert into Reply</button></x-slot:actions></x-fruit::suggestion>'));
        $card = $xpath->query('//section[contains(@class, "f-suggestion")]')->item(0);
        $this->assertSame('AI draft', $card->getAttribute('aria-label'));
        $this->assertSame('true', $card->getAttribute('aria-busy'));
        $this->assertSame('English · High', $xpath->query('.//span[@class="f-suggestion__meta"]', $card)->item(0)->textContent);
        $status = $xpath->query('.//div[contains(@class, "f-suggestion__status")]', $card)->item(0);
        $this->assertSame('working', $status->getAttribute('data-tone'));
        $this->assertFalse($status->hasAttribute('tone'));
        $this->assertSame('true', $xpath->query('.//div[contains(@class, "f-suggestion__placeholder")]', $card)->item(0)->getAttribute('aria-hidden'));
        $this->assertSame('nl', $xpath->query('.//div[@class="f-suggestion__translation"]', $card)->item(0)->getAttribute('lang'));
        $this->assertSame('group', $xpath->query('.//div[@class="f-suggestion__actions"]', $card)->item(0)->getAttribute('role'));
        // Meta can also be a slot, for markup bound from script.
        $this->assertStringContainsString('<span class="f-suggestion__meta"><span x-text="meta"></span></span>', Blade::render('<x-fruit::suggestion title="AI draft">Draft<x-slot:meta><span x-text="meta"></span></x-slot:meta></x-fruit::suggestion>'));
        $this->assertRejected('<x-fruit::suggestion title=" ">Draft</x-fruit::suggestion>', 'needs a nonempty title');
        $this->assertRejected('<x-fruit::suggestion title="AI draft">Draft<x-slot:status tone="busy">…</x-slot:status></x-fruit::suggestion>', 'suggestion status tone must be one of');
    }

    public function test_a_page_column_has_a_width_a_header_and_a_save_bar(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::page width="narrow" title="Mailbox" description="How it sends." :level="2"><p>Rows</p><x-slot:actions><button type="button">Restore</button></x-slot:actions><x-slot:footer><button type="submit">Save</button></x-slot:footer></x-fruit::page>'));
        $page = $xpath->query('//div[contains(@class, "f-page")]')->item(0);
        $this->assertSame('f-page f-page--narrow', $page->getAttribute('class'));
        $this->assertSame('Mailbox', $xpath->query('.//h2[@class="f-page__title"]', $page)->item(0)->textContent);
        $this->assertSame('How it sends.', $xpath->query('.//p[@class="f-page__description"]', $page)->item(0)->textContent);
        $this->assertSame('Restore', $xpath->query('.//div[@class="f-page__actions"]/button', $page)->item(0)->textContent);
        $this->assertSame('Save', $xpath->query('./footer[@class="f-page__footer"]/button', $page)->item(0)->textContent);
        // Section tabs sit between the header and the content, outside the body's own wrappers.
        $tabs = $this->xpath(Blade::render('<x-fruit::page title="Customer"><x-slot:nav class="extra"><nav class="f-section-nav" aria-label="Customer"><a href="#" aria-current="page">Profile</a></nav></x-slot:nav><div class="wrapper"><p>Rows</p></div></x-fruit::page>'));
        $children = $tabs->query('//div[@class="f-page"]/*');
        $this->assertSame(['f-page__header', 'f-page__nav extra', 'f-page__body'], array_map(fn ($child) => $child->getAttribute('class'), iterator_to_array($children)));
        $this->assertSame('Customer', $tabs->query('//div[@class="f-page__nav extra"]/nav')->item(0)->getAttribute('aria-label'));
        $plain = $this->xpath(Blade::render('<x-fruit::page><p>Rows</p></x-fruit::page>'));
        $this->assertSame(0, $plain->query('//header|//footer|//div[@class="f-page__nav"]')->length);
        $this->assertSame('f-page', $plain->query('//div[contains(@class, "f-page")]')->item(0)->getAttribute('class'));
        $this->assertRejected('<x-fruit::page width="full">Rows</x-fruit::page>', 'page width must be one of');
        $this->assertRejected('<x-fruit::page title="A" :level="4">Rows</x-fruit::page>', 'page level must be 1, 2 or 3');
    }

    public function test_component_attributes_take_echoed_js_values_not_directives(): void
    {
        // Blade leaves directives inside a component tag uncompiled; the documented echo works.
        $name = "Sophie's log";
        $this->assertStringContainsString('x-on:click="clear(@js($name))"', Blade::render('<x-fruit::button x-on:click="clear(@js($name))">Clear</x-fruit::button>', compact('name')));
        $this->assertStringContainsString("x-on:click=\"clear('Sophie\\u0027s log')\"", Blade::render('<x-fruit::button x-on:click="clear({{ Js::from($name) }})">Clear</x-fruit::button>', compact('name')));
    }

    public function test_a_divider_is_named_by_its_text_or_a_fuller_aria_label(): void
    {
        $named = $this->xpath(Blade::render('<x-fruit::divider>Today</x-fruit::divider>'))->query('//div[@role="separator"]')->item(0);
        $this->assertSame('Today', $named->getAttribute('aria-label'));
        $fresh = $this->xpath(Blade::render('<x-fruit::divider tone="accent" aria-label="New messages">New</x-fruit::divider>'));
        $separator = $fresh->query('//div[@role="separator"]')->item(0);
        $this->assertSame('New messages', $separator->getAttribute('aria-label'));
        $this->assertSame('New', $fresh->query('./span[@aria-hidden="true"]', $separator)->item(0)->textContent);
        $this->assertSame(1, substr_count(Blade::render('<x-fruit::divider aria-label="New messages">New</x-fruit::divider>'), 'aria-label'));
        $plain = $this->xpath(Blade::render('<x-fruit::divider />'))->query('//div[@role="separator"]')->item(0);
        $this->assertFalse($plain->hasAttribute('aria-label'));
    }

    public function test_a_history_is_a_named_focusable_region_that_follows_its_newest_message(): void
    {
        $xpath = $this->xpath(Blade::render('<x-fruit::history class="extra" wire:key="history"><ol class="f-thread"><li>Hi</li></ol></x-fruit::history>'));
        $region = $xpath->query('//div[@role="region"]')->item(0);
        $this->assertSame('Message History', $region->getAttribute('aria-label'));
        $this->assertSame('0', $region->getAttribute('tabindex'));
        $this->assertSame('f-pane__scroll f-history extra', $region->getAttribute('class'));
        $this->assertSame('fruitHistory', $region->getAttribute('x-data'));
        $this->assertSame('history', $region->getAttribute('wire:key'));
        $this->assertSame('Hi', $xpath->query('./ol/li', $region)->item(0)->textContent);
        // The Jump to Latest button is server-rendered, so Livewire morphs keep it.
        $jump = $xpath->query('./button[@class="f-button f-history__latest"]', $region)->item(0);
        $this->assertSame('button', $jump->getAttribute('type'));
        $this->assertSame('awayFromLatest', $jump->getAttribute('x-show'));
        $this->assertStringContainsString('Jump to Latest', $jump->textContent);
        $named = $this->xpath(Blade::render('<x-fruit::history aria-label="Conversation with Sophie">x</x-fruit::history>'));
        $this->assertSame('Conversation with Sophie', $named->query('//div[@role="region"]')->item(0)->getAttribute('aria-label'));
        $this->assertRejected('<x-fruit::history x-data="{}">x</x-fruit::history>', 'owns its fruitHistory helper');
        $this->assertRejected('<x-fruit::history tabindex="-1">x</x-fruit::history>', 'owns its fruitHistory helper');
        $this->assertRejected('<x-fruit::history role="log">x</x-fruit::history>', 'native control semantics');
    }

    public function test_an_accent_picker_offers_the_named_accents_as_native_radios(): void
    {
        $this->assertSame(['blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'graphite'], Fruit::ACCENTS);
        $xpath = $this->xpath(Blade::render('<x-fruit::accent-picker name="accent" value="purple" wire:model.live="accent" class="extra" />'));
        $group = $xpath->query('//div[@role="radiogroup"]')->item(0);
        $this->assertSame('Accent Color', $group->getAttribute('aria-label'));
        $this->assertSame('f-accent-picker extra', $group->getAttribute('class'));
        $this->assertFalse($group->hasAttribute('wire:model.live'));
        $radios = $xpath->query('//input[@type="radio"]', $group);
        $this->assertSame(8, $radios->length);
        $this->assertSame('accent', $radios->item(0)->getAttribute('name'));
        $this->assertSame('accent', $radios->item(1)->getAttribute('wire:model.live'));
        $this->assertTrue($radios->item(1)->hasAttribute('checked'));
        $this->assertFalse($radios->item(0)->hasAttribute('checked'));
        $this->assertSame('purple', $xpath->query('//label[@data-fruit-accent="purple"]/input')->item(0)->getAttribute('value'));
        app()->setLocale('nl');
        $this->assertStringContainsString('aria-label="Accentkleur"', Blade::render('<x-fruit::accent-picker />'));
        $this->assertStringContainsString('<span class="f-sr-only">Grafiet</span>', Blade::render('<x-fruit::accent-picker />'));
        $this->assertRejected('<x-fruit::accent-picker value="teal" />', 'accent-picker value must be one of');
        $this->assertRejected('<x-fruit::accent-picker role="listbox" />', 'overriding role');
    }

    public function test_a_card_can_group_a_choice_without_owning_its_interaction(): void
    {
        $html = Blade::render('<x-fruit::card role="group" aria-label="Notification settings"><x-fruit::checkbox name="sounds" value="1" checked>Play a sound</x-fruit::checkbox></x-fruit::card>');
        $document = $this->document($html);
        $card = $document->getElementsByTagName('section')->item(0);
        $choice = $document->getElementsByTagName('input')->item(0);
        $this->assertSame('group', $card->getAttribute('role'));
        $this->assertFalse($card->hasAttribute('checked'));
        $this->assertFalse($card->hasAttribute('value'));
        $this->assertSame('checkbox', $choice->getAttribute('role'));
        $this->assertSame('sounds', $choice->getAttribute('name'));
        $this->assertTrue($choice->hasAttribute('checked'));
    }

    public function test_every_blade_component_has_a_complete_documented_contract(): void
    {
        $root = dirname(__DIR__, 2);
        $views = $root.'/resources/views/components';
        $components = [];
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($views)) as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), '.blade.php')) {
                $name = substr($file->getPathname(), strlen($views) + 1, -strlen('.blade.php'));
                $components[] = str_replace(DIRECTORY_SEPARATOR, '.', $name);
            }
        }

        $catalog = json_decode(file_get_contents($root.'/docs/component-catalog.json'), true, flags: JSON_THROW_ON_ERROR);
        $documented = [];
        foreach ($catalog as $entry) {
            foreach ($entry['contracts'] ?? [] as $name => $contract) {
                foreach (['purpose', 'element', 'state', 'keyboard', 'options'] as $field) {
                    $this->assertNotSame('', trim($contract[$field] ?? ''), "Document {$field} for {$name}");
                }
                $this->assertContains($name, $entry['blade'], "{$name}'s contract belongs to the entry that lists its adapter");
                $documented[] = $name;
            }
        }
        sort($components);
        sort($documented);
        $this->assertSame($components, $documented, 'Adding or removing a Blade component must update the contract catalog.');
    }

    #[DataProvider('nativeInputFamilies')]
    public function test_native_input_families_forward_attributes_to_the_actual_control(string $component, string $type): void
    {
        $html = Blade::render('<x-fruit::'.$component.' type="'.$type.'" id="field" name="field" min="1" max="10" step="1" required disabled aria-label="Field" x-model="field" wire:model.live="field" @change="changed" />');
        $document = $this->document($html);
        $this->assertSame(1, $document->getElementsByTagName('input')->length);
        $input = $document->getElementsByTagName('input')->item(0);
        foreach (['type' => $type, 'id' => 'field', 'name' => 'field', 'min' => '1', 'max' => '10', 'step' => '1', 'aria-label' => 'Field', 'x-model' => 'field', 'wire:model.live' => 'field'] as $name => $value) {
            $this->assertSame($value, $input->getAttribute($name));
        }
        // Older libxml HTML parsers discard Alpine's @ shorthand. Check the emitted control.
        $this->assertMatchesRegularExpression('/<input\b[^>]*\s@change="changed"[^>]*>/s', $html);
        $this->assertTrue($input->hasAttribute('required'));
        $this->assertTrue($input->hasAttribute('disabled'));
        $this->assertSame(1, preg_match_all('/\btype="/', $html));
    }

    public static function nativeInputFamilies(): array
    {
        return [['file', 'file'], ['number', 'number'], ['date', 'date'], ['date', 'datetime-local'], ['date', 'month'], ['date', 'week'], ['time', 'time'], ['color', 'color'], ['range', 'range']];
    }

    public function test_date_and_color_inputs_carry_their_picker_popups_without_moving_the_value(): void
    {
        $date = $this->xpath(Blade::render('<x-fruit::date name="start" wire:model="start" />'));
        $wrapper = $date->query('//div[contains(@class, "f-date-picker")]')->item(0);
        $this->assertSame('fruitDatePicker', $wrapper->getAttribute('x-data'));
        $this->assertSame('Choose Date', $wrapper->getAttribute('data-fruit-label'));
        $input = $date->query('.//input', $wrapper)->item(0);
        $this->assertSame('dialog', $input->getAttribute('aria-haspopup'));
        $this->assertSame('start', $input->getAttribute('wire:model'));
        $this->assertTrue($date->query('.//div[@data-fruit-ui]', $wrapper)->item(0)->hasAttribute('wire:ignore'));

        // Month and week keep the browser's own controls: the calendar picks days.
        $month = $this->xpath(Blade::render('<x-fruit::date type="month" name="period" />'));
        $this->assertSame(0, $month->query('//div')->length);
        $this->assertFalse($month->query('//input')->item(0)->hasAttribute('aria-haspopup'));

        $color = $this->xpath(Blade::render('<x-fruit::color id="accent" name="accent" value="#007aff" />'));
        $input = $color->query('//input')->item(0);
        $this->assertSame('accent-palette', $input->getAttribute('list'));
        $palette = $color->query('//datalist[@id="accent-palette"]/option');
        $this->assertSame(13, $palette->length);
        $this->assertSame('#ff3b30', $palette->item(0)->getAttribute('value'));
        $this->assertSame('Red', $palette->item(0)->getAttribute('label'));

        $custom = $this->xpath(Blade::render('<x-fruit::color name="label" list="brand-colors" />'));
        $this->assertSame('brand-colors', $custom->query('//input')->item(0)->getAttribute('list'));
        $this->assertSame(0, $custom->query('//datalist')->length);

        $this->assertRejected('<x-fruit::date aria-expanded="true" />', 'owns its picker popup association');
        $this->assertRejected('<x-fruit::color aria-haspopup="listbox" />', 'owns its picker popup association');
    }

    public function test_file_list_and_readonly_numeric_contracts_keep_native_attributes(): void
    {
        $file = $this->document(Blade::render('<x-fruit::file name="attachments[]" accept=".csv" multiple wire:model="attachments" />'))->getElementsByTagName('input')->item(0);
        $this->assertSame('attachments[]', $file->getAttribute('name'));
        $this->assertSame('.csv', $file->getAttribute('accept'));
        $this->assertTrue($file->hasAttribute('multiple'));
        $this->assertFalse($file->hasAttribute('value'));
        $number = $this->document(Blade::render('<x-fruit::number name="seats" value="12" readonly />'))->getElementsByTagName('input')->item(0);
        $this->assertSame('12', $number->getAttribute('value'));
        $this->assertTrue($number->hasAttribute('readonly'));
    }

    #[DataProvider('newSemanticOverrides')]
    public function test_new_controls_reject_changes_to_their_semantic_contract(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function newSemanticOverrides(): array
    {
        $cases = [];
        foreach (['file', 'number', 'date', 'time', 'color', 'range', 'progress', 'meter', 'fieldset'] as $component) {
            $cases[] = ['<x-fruit::'.$component.' role="checkbox" />', 'overriding role'];
            $cases[] = ['<x-fruit::'.$component.' x-bind:type.camel="kind" />', 'type and role belong'];
            $cases[] = ['<x-fruit::'.$component.' as="button" />', 'fixed native element'];
        }
        foreach (['file', 'number', 'time', 'color', 'range'] as $component) {
            $cases[] = ['<x-fruit::'.$component.' type="text" />', 'fixed native type'];
        }
        foreach (['time', 'text', 'file', 'unknown'] as $type) {
            $cases[] = ['<x-fruit::date type="'.$type.'" />', 'date type must be one of'];
        }

        return $cases;
    }

    public function test_fieldset_and_indicators_preserve_grouping_and_native_value_models(): void
    {
        $html = Blade::render('<x-fruit::fieldset disabled name="preferences"><legend>Preferences</legend><x-fruit::checkbox name="email" value="1">Email</x-fruit::checkbox></x-fruit::fieldset><x-fruit::progress aria-label="Importing" value="4" max="10">4 of 10</x-fruit::progress><x-fruit::progress aria-label="Connecting" /><x-fruit::meter aria-label="Storage" min="0" max="100" low="60" high="85" optimum="20" value="35" />');
        $document = $this->document($html);
        $group = $document->getElementsByTagName('fieldset')->item(0);
        $this->assertTrue($group->hasAttribute('disabled'));
        $this->assertSame('legend', $group->firstChild->nodeName);
        $this->assertSame('Preferences', $group->firstChild->textContent);
        $this->assertSame('checkbox', $group->getElementsByTagName('input')->item(0)->getAttribute('type'));
        $progress = $document->getElementsByTagName('progress');
        $this->assertSame('4', $progress->item(0)->getAttribute('value'));
        $this->assertSame('10', $progress->item(0)->getAttribute('max'));
        $this->assertFalse($progress->item(1)->hasAttribute('value'));
        $this->assertFalse($progress->item(1)->hasAttribute('aria-valuenow'));
        $meter = $document->getElementsByTagName('meter')->item(0);
        foreach (['min' => '0', 'max' => '100', 'low' => '60', 'high' => '85', 'optimum' => '20', 'value' => '35'] as $name => $value) {
            $this->assertSame($value, $meter->getAttribute($name));
        }
    }
}
