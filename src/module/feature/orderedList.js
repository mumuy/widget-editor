import {orderedList as icon} from '../icon.js';

export default {
    'name':'orderedList',
    'icon':icon,
    'label':'有序列表',
    'type':'button',
    execute(editor){
        editor.command('insertOrderedList');
    },
    active(editor){
        return editor.query('insertOrderedList');
    }
};
