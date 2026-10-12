import {underline as icon} from '../icon.js';

export default {
    'name':'underline',
    'icon':icon,
    'label':'下划线',
    'type':'button',
    execute(editor){
        editor.command('underline');
    },
    active(editor){
        return editor.query('underline');
    }
};
