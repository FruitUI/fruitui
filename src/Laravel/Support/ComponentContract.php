<?php

namespace FruitUI\Support;

use Illuminate\View\ComponentAttributeBag;
use InvalidArgumentException;

/** Small, explicit contracts for the native controls exposed by Blade. */
final class ComponentContract
{
    public const INPUT_TYPES = ['text', 'email', 'password', 'search', 'tel', 'url'];
    public const BUTTON_VARIANTS = ['default', 'primary', 'ghost', 'danger'];
    public const BUTTON_TYPES = ['button', 'submit', 'reset'];
    public const CONVERSATION_ROW_VARIANTS = ['quiet', 'filled'];

    public static function input(mixed $type, ComponentAttributeBag $attributes): void
    {
        self::option('input', 'type', $type, self::INPUT_TYPES);
        self::semantics('input', $attributes);
    }

    public static function button(mixed $variant, mixed $type, ComponentAttributeBag $attributes): void
    {
        self::option('button', 'variant', $variant, self::BUTTON_VARIANTS);
        self::option('button', 'type', $type, self::BUTTON_TYPES);
        self::semantics('button', $attributes, 'button');
    }

    public static function choice(string $component, ComponentAttributeBag $attributes): void
    {
        $type = match ($component) {
            'checkbox', 'switch' => 'checkbox',
            'radio' => 'radio',
            default => throw new InvalidArgumentException("Unknown FruitUI choice component: {$component}."),
        };

        self::semantics($component, $attributes, $component, $type);
    }

    public static function conversationRow(mixed $variant, ComponentAttributeBag $attributes): void
    {
        self::option('conversation-row', 'variant', $variant, self::CONVERSATION_ROW_VARIANTS);
        self::semantics('conversation-row', $attributes, 'button', 'button');
    }

    public static function attachment(ComponentAttributeBag $attributes): void
    {
        self::semantics('attachment', $attributes, 'link');
        if (! $attributes->has('href') && ! $attributes->has(':href') && ! $attributes->has('x-bind:href')) {
            throw new InvalidArgumentException('FruitUI attachment requires href on its native link.');
        }
    }

    public static function floatingDisclosure(mixed $placement, ComponentAttributeBag $attributes): void
    {
        self::option('floating-disclosure', 'placement', $placement, ['below', 'above']);
        self::semantics('floating-disclosure', $attributes, 'group');
    }

    public static function splitter(mixed $pane, mixed $flexible, mixed $variable, mixed $min, mixed $max, mixed $reserve, mixed $edge, ComponentAttributeBag $attributes): void
    {
        self::semantics('splitter', $attributes, 'separator');
        self::option('splitter', 'edge', $edge, ['start', 'end']);
        if (! is_string($pane) || trim($pane) === '' || ! is_string($flexible) || trim($flexible) === '' || $pane === $flexible
            || ! is_string($variable) || ! preg_match('/^--f-[\w-]+$/', $variable)
            || ! is_numeric($min) || ! is_numeric($max) || ! is_numeric($reserve)
            || ! is_finite((float) $min) || ! is_finite((float) $max) || ! is_finite((float) $reserve)
            || $min <= 0 || $max < $min || $reserve <= 0) {
            throw new InvalidArgumentException('FruitUI splitter requires distinct pane/flexible IDs, a --f- variable and positive width bounds.');
        }
        foreach ($attributes->all() as $name => $value) {
            $name = strtolower($name);
            $ownedBinding = false;
            foreach (['x-data', ':tabindex', 'x-bind:tabindex', ':aria-orientation', 'x-bind:aria-orientation', ':aria-controls', 'x-bind:aria-controls'] as $binding) {
                if ($name === $binding || str_starts_with($name, $binding.'.')) $ownedBinding = true;
            }
            if ($ownedBinding
                || ($name === 'tabindex' && (string) $value !== '0') || ($name === 'aria-orientation' && $value !== 'vertical')
                || ($name === 'aria-controls' && $value !== $pane)) {
                throw new InvalidArgumentException('FruitUI splitter owns its orientation, focus, controlled pane and Alpine helper.');
            }
        }
    }

    /** Native roles are fixed; structural containers allow documented grouping roles. */
    public static function semantics(string $component, ComponentAttributeBag $attributes, string|array|null $role = null, ?string $fixedType = null): void
    {
        $roles = is_array($role) ? $role : ($role === null ? [] : [$role]);
        foreach ($attributes->all() as $name => $value) {
            $name = strtolower($name);

            if ($name === 'as') {
                throw new InvalidArgumentException("FruitUI {$component} has a fixed native element; compose another component instead of using as.");
            }

            if ($name === 'type' && ($fixedType === null || $value !== $fixedType)) {
                throw new InvalidArgumentException("FruitUI {$component} has a fixed native type; use the component for the control you need.");
            }

            if ($name === 'role' && ! in_array($value, $roles, true)) {
                throw new InvalidArgumentException("FruitUI {$component} uses its native control semantics; use a separate component instead of overriding role.");
            }

            // Server-bound :type props are validated above. Client bindings must
            // not turn a text field into a choice or change a control's role.
            foreach ([':type', 'x-bind:type', ':role', 'x-bind:role'] as $binding) {
                if ($name === $binding || str_starts_with($name, $binding.'.')) {
                    throw new InvalidArgumentException("FruitUI {$component} does not support {$name}; type and role belong to its component contract.");
                }
            }
        }
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
