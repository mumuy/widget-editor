import {unorderedList as icon} from '../icon.js';

export default {
    'name':'unorderedList',
    'icon':icon,
    'label':'无序列表',
    'type':'button',
    execute(editor){
        editor.command('insertUnorderedList');
    },
    active(editor){
        return editor.query('insertUnorderedList');
    }
};
