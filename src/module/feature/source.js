import formatHTML from '../method/formatHTML.js';
import icon from '../../image/source.svg';

export default {
    'name':'source',
    'icon':icon,
    'label':'源代码',
    'type':'button',
    execute(editor){
        editor.toggleSource();
    },
    format(editor){
        if(!editor.source){
            return;
        }
        editor.sourceArea.value = formatHTML(editor.sourceArea.value);
        editor.sourceArea.dispatchEvent(new Event('input',{bubbles:true}));
        editor.notify('HTML 已格式化');
    },
    active(editor){
        return editor.source;
    }
};
