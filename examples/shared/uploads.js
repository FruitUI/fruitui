/** Demo-only local simulation. Real applications supply their upload transport. */
export function uploadDemo() {
  let interval,
    sequence = 0;
  return {
    files: [],
    init() {
      interval = setInterval(() => {
        for (const file of this.files)
          if (file.state === 'uploading') {
            file.progress = Math.min(100, file.progress + 10);
            if (file.progress === 100) file.state = 'complete';
          }
      }, 500);
    },
    addFiles(files) {
      for (const file of files)
        this.files.push({
          id: ++sequence,
          name: file.name,
          progress: 0,
          state: 'uploading',
          url: URL.createObjectURL(file),
        });
    },
    cancel(file) {
      file.state = 'cancelled';
    },
    fail(file) {
      file.state = 'error';
    },
    retry(file) {
      file.state = 'uploading';
      file.progress = 0;
    },
    remove(file) {
      URL.revokeObjectURL(file.url);
      this.files = this.files.filter(item => item.id !== file.id);
    },
    destroy() {
      clearInterval(interval);
      for (const file of this.files) URL.revokeObjectURL(file.url);
    },
  };
}
