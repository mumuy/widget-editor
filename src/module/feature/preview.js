import {preview as icon} from '../icon.js';
import EditorPreview from '../preview.js';

export default {
    name:'preview',icon,label:'手机预览',type:'button',
    bind(editor){
        editor.preview = new EditorPreview(editor);
    },
    execute(editor){
        editor.preview.toggle();
    },
    active(editor){
        return !!editor.preview?.active;
    }
};
