import {format as icon} from '../icon.js';

export default {
    'name':'format',
    'icon':icon,
    'label':'清除格式',
    'type':'button',
    execute(editor){
        editor.command('removeFormat');
    }
};
