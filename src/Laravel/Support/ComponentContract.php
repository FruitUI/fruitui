<?php

namespace FruitUI\Support;

use Illuminate\View\ComponentAttributeBag;
use InvalidArgumentException;

/** Small, explicit contracts for the native controls exposed by Blade. */
final class ComponentContract
{
    public const INPUT_TYPES = ['text', 'email', 'password', 'search', 'tel', 'url'];

    public const DATE_TYPES = ['date', 'datetime-local', 'month', 'week'];

    public const BUTTON_VARIANTS = ['default', 'primary', 'ghost', 'danger'];

    public const BUTTON_TYPES = ['button', 'submit', 'reset'];

    public const ITEM_ROW_VARIANTS = ['quiet', 'filled'];

    private const ENHANCED = ['data-fruit-control', 'hidden'];

    /**
     * roles: explicit roles a caller may repeat or choose; every other role is rejected.
     * type: the fixed native type a caller may repeat; any other type is rejected.
     * options: allowed values for each documented prop.
     * owns: attributes the component manages; literal values and client bindings are rejected.
     */
    private const CONTRACTS = [
        'alert' => ['roles' => ['status', 'alert', 'group'], 'options' => ['tone' => ['info', 'success', 'warning', 'danger']]],
        'attachment' => ['roles' => ['link']],
        'avatar' => [],
        'badge' => ['roles' => ['status']],
        'button' => ['roles' => ['button'], 'options' => ['variant' => self::BUTTON_VARIANTS, 'type' => self::BUTTON_TYPES]],
        'card' => ['roles' => ['group', 'region']],
        'checkbox' => ['roles' => ['checkbox'], 'type' => 'checkbox'],
        'color' => ['type' => 'color'],
        'combobox' => ['owns' => [...self::ENHANCED, 'multiple', 'size'], 'message' => 'owns enhancement visibility and its single value contract'],
        'composer' => ['roles' => ['form']],
        'date' => ['options' => ['type' => self::DATE_TYPES]],
        'description-list' => [],
        'dialog' => ['roles' => ['dialog', 'alertdialog']],
        'disclosure' => ['roles' => ['group']],
        'editor' => ['owns' => self::ENHANCED, 'message' => 'owns enhancement visibility and its single value contract'],
        'empty-state' => ['roles' => ['group', 'region']],
        'field' => ['roles' => ['group']],
        'fieldset' => ['roles' => ['group']],
        'file' => ['type' => 'file'],
        'floating-disclosure' => ['roles' => ['group'], 'options' => ['placement' => ['below', 'above']]],
        'input' => ['options' => ['type' => self::INPUT_TYPES]],
        'item-list' => ['roles' => ['list']],
        'item-row' => ['roles' => ['button'], 'type' => 'button', 'options' => ['variant' => self::ITEM_ROW_VARIANTS]],
        'menu' => ['roles' => ['group'], 'owns' => ['x-data'], 'message' => 'owns its Alpine keyboard helper. Put application state on a parent'],
        'menu-item' => ['roles' => ['menuitem'], 'type' => 'button', 'options' => ['variant' => ['default', 'danger']]],
        'menu-trigger' => ['roles' => ['button']],
        'meter' => ['roles' => ['meter']],
        'number' => ['type' => 'number'],
        'pagination' => ['roles' => ['navigation']],
        'pane' => ['roles' => ['group', 'region']],
        'progress' => ['roles' => ['progressbar']],
        'radio' => ['roles' => ['radio'], 'type' => 'radio'],
        'range' => ['type' => 'range'],
        'section-nav' => ['roles' => ['navigation']],
        'select' => [],
        'sidebar' => ['roles' => ['navigation']],
        'sidebar-group' => ['roles' => ['group']],
        'sidebar-item' => ['roles' => ['link']],
        'splitter' => ['roles' => ['separator'], 'options' => ['edge' => ['start', 'end']], 'owns' => ['x-data'], 'message' => 'owns its orientation, focus, controlled pane and Alpine helper'],
        'switch' => ['roles' => ['switch'], 'type' => 'checkbox'],
        'tab' => ['roles' => ['tab'], 'type' => 'button'],
        'table' => ['roles' => ['table']],
        'tabs' => ['roles' => ['tablist']],
        'textarea' => ['roles' => ['textbox']],
        'time' => ['type' => 'time'],
        'toast' => ['roles' => ['status']],
        'toaster' => ['roles' => ['status'], 'owns' => ['x-data', 'x-show', 'x-text'], 'message' => 'owns its fruitToast helper and message. Dispatch fruit-toast events instead'],
        'token-field' => ['owns' => self::ENHANCED, 'message' => 'owns enhancement visibility and its single value contract'],
        'tooltip' => ['owns' => ['x-data'], 'message' => 'owns its fruitTooltip helper. Put application state on a parent'],
        'workspace' => ['roles' => ['group', 'region']],
    ];

    /** Validate documented options and reject attributes that would change the component's semantics. */
    public static function validate(string $component, ComponentAttributeBag $attributes, array $options = []): void
    {
        $contract = self::CONTRACTS[$component] ?? throw new InvalidArgumentException("Unknown FruitUI component: {$component}.");
        foreach ($options as $name => $value) {
            self::option($component, $name, $value, $contract['options'][$name]);
        }
        $roles = $contract['roles'] ?? [];
        $owned = $contract['owns'] ?? [];
        foreach ($attributes->all() as $name => $value) {
            $name = strtolower($name);
            if ($name === 'as') {
                throw new InvalidArgumentException("FruitUI {$component} has a fixed native element; compose another component instead of using as.");
            }
            if ($name === 'type' && $value !== ($contract['type'] ?? null)) {
                throw new InvalidArgumentException("FruitUI {$component} has a fixed native type; use the component for the control you need.");
            }
            if ($name === 'role' && ! in_array($value, $roles, true)) {
                throw new InvalidArgumentException("FruitUI {$component} uses its native control semantics; use a separate component instead of overriding role.");
            }
            // Server-bound props are validated above. Client bindings must
            // not turn a text field into a choice or change a control's role.
            if (self::binds($name, 'type') || self::binds($name, 'role')) {
                throw new InvalidArgumentException("FruitUI {$component} does not support {$name}; type and role belong to its component contract.");
            }
            foreach ($owned as $attribute) {
                if ($name === $attribute || self::binds($name, $attribute)) {
                    throw new InvalidArgumentException("FruitUI {$component} {$contract['message']}.");
                }
            }
        }
    }

    public static function attachment(ComponentAttributeBag $attributes): void
    {
        self::validate('attachment', $attributes);
        if (! $attributes->has('href') && ! $attributes->has(':href') && ! $attributes->has('x-bind:href')) {
            throw new InvalidArgumentException('FruitUI attachment requires href on its native link.');
        }
    }

    /** Returns whether the dialog's open state is bound with wire:model or x-model. */
    public static function dialog(mixed $name, ComponentAttributeBag $attributes): bool
    {
        self::validate('dialog', $attributes);
        if ($name !== null && (! is_string($name) || ! preg_match('/^[\w.:-]+$/', $name))) {
            throw new InvalidArgumentException('FruitUI dialog name must be letters, digits, dashes, dots, colons or underscores.');
        }
        $names = array_map('strtolower', array_keys($attributes->all()));
        $bound = (bool) preg_grep('/^(wire:model|x-model)(\.|$)/', $names);
        if ($bound && preg_grep('/^(:|x-bind:)?(x-data|x-modelable)(\.|$)/', $names)) {
            throw new InvalidArgumentException('FruitUI dialog owns its open state when bound with wire:model or x-model. Put application state on a parent.');
        }

        return $bound;
    }

    public static function sidebarItem(mixed $current, ComponentAttributeBag $attributes): void
    {
        self::validate('sidebar-item', $attributes);
        if (! is_bool($current)) {
            throw new InvalidArgumentException('FruitUI sidebar-item current must be a boolean.');
        }
        if (! $attributes->has('href') && ! $attributes->has(':href') && ! $attributes->has('x-bind:href')) {
            throw new InvalidArgumentException('FruitUI sidebar-item requires href on its native link.');
        }
    }

    public static function tooltip(mixed $text, mixed $textId, ComponentAttributeBag $attributes): void
    {
        self::validate('tooltip', $attributes);
        if (! self::identifier($text) || ! self::identifier($textId) || preg_match('/\s/', $textId)) {
            throw new InvalidArgumentException('FruitUI tooltip requires text and a text-id that its trigger references with aria-describedby.');
        }
    }

    /** Returns the message to show first: the explicit one, or the flashed fruit-toast session value. */
    public static function toaster(mixed $duration, mixed $message, ComponentAttributeBag $attributes): ?string
    {
        self::validate('toaster', $attributes);
        if (! is_int($duration) && ! (is_string($duration) && ctype_digit($duration))) {
            throw new InvalidArgumentException('FruitUI toaster duration must be a nonnegative number of milliseconds.');
        }
        if ($message === null && app()->bound('session')) {
            $message = app('session')->get('fruit-toast');
        }
        if ($message !== null && ! is_string($message)) {
            throw new InvalidArgumentException('FruitUI toaster message must be text.');
        }

        return $message === '' ? null : $message;
    }

    public static function splitter(mixed $pane, mixed $flexible, mixed $variable, mixed $min, mixed $max, mixed $reserve, mixed $edge, ComponentAttributeBag $attributes): void
    {
        self::validate('splitter', $attributes, ['edge' => $edge]);
        $bounds = [$min, $max, $reserve];
        if (! self::identifier($pane) || ! self::identifier($flexible) || $pane === $flexible
            || ! is_string($variable) || ! preg_match('/^--f-[\w-]+$/', $variable)
            || array_filter($bounds, fn ($bound) => ! is_numeric($bound) || ! is_finite((float) $bound) || $bound <= 0)
            || $max < $min) {
            throw new InvalidArgumentException('FruitUI splitter requires distinct pane/flexible IDs, a --f- variable and positive width bounds.');
        }
        foreach (['tabindex' => '0', 'aria-orientation' => 'vertical', 'aria-controls' => $pane] as $attribute => $fixed) {
            foreach ($attributes->all() as $name => $value) {
                $name = strtolower($name);
                if (self::binds($name, $attribute) || ($name === $attribute && (string) $value !== $fixed)) {
                    throw new InvalidArgumentException('FruitUI splitter owns its orientation, focus, controlled pane and Alpine helper.');
                }
            }
        }
    }

    public static function wrapper(mixed $attributes): ComponentAttributeBag
    {
        if (! is_array($attributes) && ! $attributes instanceof ComponentAttributeBag) {
            throw new InvalidArgumentException('FruitUI wrapper must be an attribute array or bag.');
        }
        $bag = $attributes instanceof ComponentAttributeBag ? $attributes : new ComponentAttributeBag($attributes);
        foreach ($bag->all() as $name => $value) {
            if (! in_array($name, ['id', 'class', 'style', 'dir', 'lang'], true) && ! preg_match('/^data-[a-z0-9-]+$/', $name)) {
                throw new InvalidArgumentException('FruitUI wrapper accepts presentation and data attributes; control bindings belong on the native control.');
            }
        }

        return $bag;
    }

    /** Merge a Field's label, description and error associations into its control. */
    public static function fieldControl(ComponentAttributeBag $attributes, ?FieldContext $field): ComponentAttributeBag
    {
        if ($field === null) {
            return $attributes;
        }
        $id = $field->bind($attributes);
        $error = $field->error();
        $described = preg_split('/\s+/', trim($attributes->get('aria-describedby', '')), -1, PREG_SPLIT_NO_EMPTY);
        if ($field->description !== null && $field->description !== '') {
            $described[] = $field->descriptionId();
        }
        if ($error !== null) {
            $described[] = $field->errorId();
            $attributes = $attributes->except('aria-invalid')->merge(['aria-invalid' => 'true']);
        }
        if ($described) {
            $attributes = $attributes->except('aria-describedby')->merge(['aria-describedby' => implode(' ', array_unique($described))]);
        }

        return $attributes->merge(['id' => $id]);
    }

    /** Whether an attribute name is a Blade or Alpine client binding of the given attribute, with optional modifiers. */
    private static function binds(string $name, string $attribute): bool
    {
        foreach ([':', 'x-bind:'] as $prefix) {
            if ($name === $prefix.$attribute || str_starts_with($name, $prefix.$attribute.'.')) {
                return true;
            }
        }

        return false;
    }

    private static function identifier(mixed $value): bool
    {
        return is_string($value) && trim($value) !== '';
    }

    private static function option(string $component, string $name, mixed $value, array $allowed): void
    {
        if (! in_array($value, $allowed, true)) {
            $choices = implode(', ', $allowed);
            $hint = $component === 'input' ? ' Use checkbox, radio, or switch components for selection controls.' : '';
            throw new InvalidArgumentException("FruitUI {$component} {$name} must be one of: {$choices}.{$hint}");
        }
    }
}
