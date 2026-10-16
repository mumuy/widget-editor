import {blockquote as icon} from '../icon.js';
import {quoted} from '../commands/paragraph.js';

export default {
    'name':'blockquote',
    'icon':icon,
    'label':'块引用',
    'type':'button',
    execute(editor){
        editor.command('blockquote');
    },
    active(editor){
        return quoted(editor);
    }
};
