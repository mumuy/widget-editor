import {divider as icon} from '../icon.js';

export default {
    'name':'divider',
    'label':'插入分割线',
    'icon':icon,
    'type':'button',
    execute(editor){
        editor.command('divider');
    }
};
