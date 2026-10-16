import {format as icon} from '../icon.js';
import clearFormat from '../method/clearFormat.js';

export default {
    'name':'format',
    'icon':icon,
    'label':'清除格式',
    'type':'button',
    execute(editor){
        editor.cancelPainter();
        editor.transaction(()=>{
            let range = clearFormat(editor.content,editor.getRange());
            editor.selection.select(range);
            document.execCommand('removeFormat');
        });
    }
};
