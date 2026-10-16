import {indentIncrease as icon} from '../icon.js';
import {indentedSelection} from '../commands/paragraph.js';

export default {
    'name':'indentation',
    'label':'缩进',
    'icon':icon,
    'type':'button',
    execute(editor){
        editor.command('indentation');
    },
    active(editor){
        return indentedSelection(editor);
    }
};
