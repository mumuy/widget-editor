import {link as icon} from '../icon.js';
import EditorLink from '../link.js';

export default {
    'name':'link',
    'icon':icon,
    'label':'超链接',
    'type':'button',
    bind(editor){
        editor.links = new EditorLink(editor);
    },
    execute(editor){
        editor.links.openDialog();
    },
    active(editor){
        let $element = editor.selectedElement();
        return !!($element && $element.closest('a:not([download])'));
    }
};
