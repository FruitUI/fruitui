import Alpine from 'alpinejs';
import '../src/fruitui.css';
import './shared/showcase.css';
import fruitUI from '../src/js/alpine.js';
import { installIcons } from './shared/icons.js';
import { appearance } from './shared/appearance.js';
import { mailDemo } from './mail/mail.js';

installIcons();
fruitUI(Alpine);
Alpine.data('appearance', appearance);
Alpine.data('mailDemo', mailDemo);
Alpine.start();
