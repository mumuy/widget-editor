export default {
    'name':'bold',
    'label':'加粗',
    'icon':'B',
    'type':'button',
    execute(editor){
        editor.command('bold');
    },
    active(editor){
        return editor.query('bold');
    }
};
