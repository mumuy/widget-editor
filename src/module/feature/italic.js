import icon from '../../image/italic.svg';

export default {
    'name':'italic',
    'icon':icon,
    'label':'斜体',
    'type':'button',
    execute(editor){
        editor.command('italic');
    },
    active(editor){
        return editor.query('italic');
    }
};
