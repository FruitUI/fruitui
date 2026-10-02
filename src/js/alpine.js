/** Register on your existing Alpine instance before it starts (including Livewire's instance). */
export default function fruitUI(Alpine) {
  Alpine.data('fruitDialog', () => ({
    open() { this.$refs.dialog.showModal(); },
    close() { this.$refs.dialog.close(); },
  }));
}
