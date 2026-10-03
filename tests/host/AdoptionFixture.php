<?php

namespace FruitUI\BrowserHost;

use Livewire\Component;

class AdoptionFixture extends Component
{
    public string $owner = 'alex';

    public string $recipients = 'alex@example.com';

    public string $signature = '<p>Thanks</p>';

    public string $blurSignature = '<p>Regards</p>';

    public int $commits = 0;

    public int $blurCommits = 0;

    public bool $changed = false;

    public bool $readonly = false;

    public function updatedSignature(): void
    {
        $this->commits++;
    }

    public function updatedBlurSignature(): void
    {
        $this->blurCommits++;
    }

    public function mutate(): void
    {
        $this->changed = true;
        $this->owner = 'morgan';
        $this->recipients = 'mia@example.com';
        $this->readonly = true;
    }

    public function render()
    {
        return view('fixture');
    }
}
