/*
 * Pages with a rich editor load it in this script, before the shared entry (main.js): it registers on
 * the one Alpine instance before Alpine starts, and the page's load event waits for both, so nothing
 * on the page can be used before Alpine is running. Pages without an editor never load it.
 */
import Alpine from 'alpinejs';
import fruitEditor from '../src/js/editor.js';

fruitEditor(Alpine);
