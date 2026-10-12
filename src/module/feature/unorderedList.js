import icon from '../../image/unorderedList.svg';

export default {
    'name':'unorderedList',
    'icon':icon,
    'label':'无序列表',
    'type':'button',
    execute(editor){
        editor.command('insertUnorderedList');
    },
    active(editor){
        return editor.query('insertUnorderedList');
    }
};
