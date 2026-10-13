import {code as icon} from '../icon.js';
import EditorCode from '../code/editor.js';

export default {
    'name':'code',
    'label':'插入代码块',
    'icon':icon,
    'type':'button',
    bind(editor){
        editor.codes = new EditorCode(editor);
        editor.codes.normalize(editor.selection.range);
    },
    execute(editor){
        editor.codes.insert();
    }
};
