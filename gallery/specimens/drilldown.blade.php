{{-- Levels side by side, each opened from a row of the level before; the rows on the way are current. Where
     they don't all fit, the deepest show and the first leads back with its Back Link; a phone shows one. --}}
<x-fruit::workspace aria-label="Drill-Down preview" style="--f-workspace-height: 340px; --f-workspace-background: var(--f-grouped-background)">
    <x-fruit::drilldown>
        <x-fruit::drilldown-column title="Mailboxes" id="drilldown-mailboxes">
            <x-fruit::page width="narrow">
                <x-fruit::form-section>
                    <a class="f-form-row f-form-row--link" href="#component-drilldown" aria-current="true"><span>Support</span></a>
                    <a class="f-form-row f-form-row--link" href="#component-drilldown"><span>Billing</span></a>
                </x-fruit::form-section>
            </x-fruit::page>
        </x-fruit::drilldown-column>
        <x-fruit::drilldown-column title="Support" id="drilldown-support">
            <x-slot:back><x-fruit::back-link href="#component-drilldown">Mailboxes</x-fruit::back-link></x-slot:back>
            <x-fruit::page width="narrow">
                <x-fruit::form-section>
                    <a class="f-form-row f-form-row--link" href="#component-drilldown" aria-current="page"><span>Connection</span><span class="f-form-row__value">SMTP</span></a>
                    <a class="f-form-row f-form-row--link" href="#component-drilldown"><span>Auto Reply</span><span class="f-form-row__value">Off</span></a>
                </x-fruit::form-section>
            </x-fruit::page>
        </x-fruit::drilldown-column>
        <x-fruit::drilldown-column title="Connection" id="drilldown-connection">
            <x-slot:back><x-fruit::back-link href="#component-drilldown">Support</x-fruit::back-link></x-slot:back>
            <x-slot:actions><x-fruit::button size="small">Test</x-fruit::button></x-slot:actions>
            <x-fruit::page width="narrow">
                <x-fruit::form-section title="Sending" :level="3">
                    <x-fruit::field label="Server" layout="row"><x-fruit::input name="drilldown_host" value="smtp.forma.example" /></x-fruit::field>
                    <x-fruit::field label="Port" layout="row"><x-fruit::number name="drilldown_port" value="587" /></x-fruit::field>
                </x-fruit::form-section>
            </x-fruit::page>
        </x-fruit::drilldown-column>
    </x-fruit::drilldown>
</x-fruit::workspace>
