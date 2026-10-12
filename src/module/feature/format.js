import {format as icon} from '../icon.js';
import clearFormat from '../method/clearFormat.js';

export default {
    'name':'format',
    'icon':icon,
    'label':'清除格式',
    'type':'button',
    execute(editor){
        editor.cancelPainter();
        editor.history.record();
        editor.transaction(()=>{
            let range = clearFormat(editor.content,editor.getRange());
            let selection = editor.shadowRoot.getSelection?.()||window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            editor.selection.range = range.cloneRange();
            document.execCommand('removeFormat');
        });
    }
};
