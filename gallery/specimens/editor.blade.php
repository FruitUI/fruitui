<form class="f-stack" id="editor-example" x-data="{ signature: '&lt;p&gt;Thanks,&lt;br&gt;&lt;strong&gt;Alex Morgan&lt;/strong&gt;&lt;/p&gt;' }" @submit.prevent>
    <label class="f-label" for="gallery-editor">Reply signature</label>
    <x-fruit::editor id="gallery-editor" name="signature" x-model="signature" required>{{ '<p>Thanks,<br><strong>Alex Morgan</strong></p>' }}</x-fruit::editor>
    <div class="f-row">
        <x-fruit::button @click="signature = '&lt;p&gt;Mia Patel&lt;/p&gt;'">Set signature externally</x-fruit::button>
        <x-fruit::button type="reset">Reset signature</x-fruit::button>
    </div>
</form>
