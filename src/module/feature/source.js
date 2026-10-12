import {source as icon} from '../icon.js';

export default {
    'name':'source',
    'icon':icon,
    'label':'源代码',
    'type':'button',
    execute(editor){
        editor.toggleSource();
    },
    active(editor){
        return editor.source;
    }
};
