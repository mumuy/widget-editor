import icon from '../../image/format.svg';

export default {
    'name':'format',
    'icon':icon,
    'label':'清除格式',
    'type':'button',
    execute(editor){
        editor.command('removeFormat');
    }
};
