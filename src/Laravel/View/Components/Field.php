<?php

namespace FruitUI\View\Components;

use Illuminate\View\Component;
use InvalidArgumentException;

/** A scoped association for one control, independent of application props/state. */
class Field extends Component
{
    public array $fruitField;

    public function __construct(
        public mixed $controlId = null,
        public mixed $label = null,
        public mixed $description = null,
        public mixed $error = null,
    ) {
        if (! is_string($controlId) || trim($controlId) === '' || preg_match('/\s/', $controlId)) {
            throw new InvalidArgumentException('FruitUI Field requires a nonempty control-id without whitespace.');
        }
        if (! is_string($label) || trim($label) === '') {
            throw new InvalidArgumentException('FruitUI Field requires a nonempty label.');
        }
        if (($description !== null && ! is_string($description)) || ($error !== null && ! is_string($error))) {
            throw new InvalidArgumentException('FruitUI Field description and error must be text strings.');
        }
        $this->fruitField = ['id' => $controlId, 'description' => $description, 'error' => $error];
    }

    public function render() { return view('fruit::components.field'); }
}
