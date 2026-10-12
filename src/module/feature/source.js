export default {
    'name':'source',
    'label':'源代码',
    'icon':'</>',
    'type':'button',
    execute(editor){
        editor.toggleSource();
    },
    active(editor){
        return editor.source;
    }
};
