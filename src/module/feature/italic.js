export default {
    'name':'italic',
    'label':'斜体',
    'icon':'I',
    'type':'button',
    execute(editor){
        editor.command('italic');
    },
    active(editor){
        return editor.query('italic');
    }
};
