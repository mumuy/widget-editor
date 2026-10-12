export default {
    'name':'unorderedList',
    'label':'无序列表',
    'icon':'•',
    'type':'button',
    execute(editor){
        editor.command('insertUnorderedList');
    },
    active(editor){
        return editor.query('insertUnorderedList');
    }
};
