<?php

namespace FruitUI\Support;

use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;
use Illuminate\View\ComponentAttributeBag;

/**
 * One Field's label/description/error association, shared with its child control.
 *
 * The child adapter renders before the Field's own markup, so it resolves the
 * validation message from its model or name and the Field then displays it.
 */
final class FieldContext
{
    private ?string $resolved = null;

    public function __construct(
        public readonly string $id,
        public readonly ?string $description,
        private readonly ?string $error,
    ) {}

    public function descriptionId(): string
    {
        return "{$this->id}-description";
    }

    public function errorId(): string
    {
        return "{$this->id}-error";
    }

    /** An explicit error wins; null looks up the shared validation errors; an empty string means none. */
    public function resolveError(ComponentAttributeBag $attributes): ?string
    {
        if ($this->error !== null) {
            return $this->error();
        }
        $key = self::errorKey($attributes);
        $errors = app('view')->shared('errors');
        if ($errors instanceof ViewErrorBag) {
            $errors = $errors->getBag('default');
        }
        $message = $key !== null && $errors instanceof MessageBag ? $errors->first($key) : '';

        return $this->resolved = $message === '' ? null : $message;
    }

    public function error(): ?string
    {
        return $this->error === null ? $this->resolved : ($this->error === '' ? null : $this->error);
    }

    /** wire:model="form.email" → form.email; name="items[0][title]" → items.0.title; name="tags[]" → tags. */
    private static function errorKey(ComponentAttributeBag $attributes): ?string
    {
        foreach ($attributes->all() as $name => $value) {
            if (is_string($value) && $value !== '' && preg_match('/^wire:model(\.|$)/', $name)) {
                return $value;
            }
        }
        $name = $attributes->get('name');
        if (! is_string($name) || $name === '') {
            return null;
        }

        return str_replace(['][', '[', ']'], ['.', '.', ''], preg_replace('/\[\]$/', '', $name));
    }
}
