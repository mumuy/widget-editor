import {mobile as icon} from '../icon.js';
import EditorMobile from '../mobile.js';

export default {
    name:'mobile',icon,label:'手机预览',type:'button',view:true,
    bind(editor){
        editor.mobile = new EditorMobile(editor);
    },
    execute(editor){
        editor.mobile.toggle();
    },
    active(editor){
        return !!editor.mobile?.active;
    }
};
