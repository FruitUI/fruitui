<!doctype html><html class="fruit-ui" lang="en"><head><title>FruitUI toast action</title>
<link rel="stylesheet" href="http://127.0.0.1:5173/src/fruitui.css">@livewireStyles</head><body>
<x-fruit::toaster message="Reply sent." :duration="15000" tone="success">
    <x-slot:action><form method="POST" action="/native-submit"><input type="hidden" name="reply" value="undo"><button class="f-button f-button--ghost f-button--small" type="submit">Undo</button></form></x-slot:action>
</x-fruit::toaster>
@livewireScriptConfig
<script type="module" data-navigate-once>
import { Livewire, Alpine } from 'http://127.0.0.1:5173/vendor/livewire/livewire/dist/livewire.esm.js';
import fruitUI from 'http://127.0.0.1:5173/src/js/alpine.js';
fruitUI(Alpine); Livewire.start();
</script></body></html>
