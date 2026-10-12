import {strikethrough as icon} from '../icon.js';

export default {
    'name':'strikethrough',
    'icon':icon,
    'label':'删除线',
    'type':'button',
    execute(editor){
        editor.command('strikeThrough');
    },
    active(editor){
        return editor.query('strikeThrough');
    }
};
