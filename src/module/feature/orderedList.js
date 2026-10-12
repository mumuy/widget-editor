export default {
    'name':'orderedList',
    'label':'有序列表',
    'icon':'1.',
    'type':'button',
    execute(editor){
        editor.command('insertOrderedList');
    },
    active(editor){
        return editor.query('insertOrderedList');
    }
};
