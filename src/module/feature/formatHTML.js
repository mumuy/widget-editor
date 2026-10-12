import formatHTML from '../method/formatHTML.js';

export default {
    'name':'formatHTML',
    'label':'格式化 HTML',
    'icon':'{}',
    'type':'button',
    'allowSource':true,
    execute(editor){
        if(!editor.source){
            editor.toggleSource();
        }
        editor.sourceArea.value = formatHTML(editor.sourceArea.value);
        editor.notify('HTML 已格式化');
    }
};
