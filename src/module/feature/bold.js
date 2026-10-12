import {bold as icon} from '../icon.js';

export default {
    'name':'bold',
    'icon':icon,
    'label':'加粗',
    'type':'button',
    execute(editor){
        editor.command('bold');
    },
    active(editor){
        return editor.query('bold');
    }
};
