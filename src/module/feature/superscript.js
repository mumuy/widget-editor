import {superscript as icon} from '../icon.js';

export default {
    'name':'superscript',
    'icon':icon,
    'label':'上标',
    'type':'button',
    execute(editor){
        editor.command('superscript',null,false);
    },
    active(editor){
        return editor.query('superscript');
    }
};
