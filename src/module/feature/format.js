export default {
    'name':'format',
    'label':'清除格式',
    'icon':'Tx',
    'type':'button',
    execute(editor){
        editor.command('removeFormat');
    }
};
