import {subscript as icon} from '../icon.js';

export default {
    'name':'subscript',
    'icon':icon,
    'label':'下标',
    'type':'button',
    execute(editor){
        editor.command('subscript',null,false);
    },
    active(editor){
        return editor.query('subscript');
    }
};
