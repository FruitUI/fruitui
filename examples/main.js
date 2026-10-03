import Alpine from 'alpinejs';
import '../src/fruitui.css';
import './shared/showcase.css';
import fruitUI from '../src/js/alpine.js';
import { installIcons } from './shared/icons.js';
import { appearance } from './shared/appearance.js';
import { withPreview } from './shared/preview.js';
import { mailDemo } from './mail/mail.js';
import { supportDemo } from './support/support.js';
import { chatDemo } from './chat/chat.js';
import { adminDemo } from './admin/admin.js';
import { uploadDemo } from './shared/uploads.js';

installIcons();
fruitUI(Alpine);
if (document.querySelector('.f-editor')) {
  const { default: fruitEditor } = await import('../src/js/editor.js');
  fruitEditor(Alpine);
}
Alpine.data('appearance', appearance);
Alpine.data('mailDemo', withPreview(mailDemo));
Alpine.data('supportDemo', withPreview(supportDemo));
Alpine.data('chatDemo', withPreview(chatDemo));
Alpine.data('adminDemo', withPreview(adminDemo));
Alpine.data('uploadDemo', uploadDemo);
Alpine.start();
