<!doctype html><html class="fruit-ui" lang="en"><head><title>FruitUI Laravel host</title>
<link rel="stylesheet" href="http://127.0.0.1:5173/src/fruitui.css">@livewireStyles</head><body>
@livewire($component ?? 'fruit-adoption', $parameters ?? [])
<x-fruit::toaster />
<x-fruit::confirmer />
@livewireScriptConfig
<script type="module" data-navigate-once>
import { Livewire, Alpine } from 'http://127.0.0.1:5173/vendor/livewire/livewire/dist/livewire.esm.js';
import fruitUI from 'http://127.0.0.1:5173/src/js/alpine.js';
import fruitEditor from 'http://127.0.0.1:5173/src/js/editor.js';
fruitUI(Alpine); fruitEditor(Alpine); Livewire.start();
</script></body></html>
