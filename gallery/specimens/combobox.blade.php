<form class="f-stack" id="combobox-example" x-data="{ choice: 'support' }" @submit.prevent>
    <label class="f-label" for="gallery-assignee">Assign Conversation</label>
    <x-fruit::combobox id="gallery-assignee" name="assignee" x-model="choice" required>
        <option value="support" selected>Support Team</option>
        <option value="alex">Alex Morgan</option>
        <option value="mia">Mia Patel</option>
        <optgroup label="Unavailable" disabled><option value="noah">Noah Williams</option></optgroup>
    </x-fruit::combobox>
    <div class="f-row">
        <x-fruit::button @click="choice = 'mia'">Assign Mia Externally</x-fruit::button>
        <x-fruit::button type="reset">Reset Choice</x-fruit::button>
    </div>
</form>
