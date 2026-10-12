import {alignment as icon,alignCenter as center,alignRight as right,alignJustify as justify} from '../icon.js';

export default {
    'name':'alignment',
    'icon':icon,
    'label':'对齐方式',
    'type':'dropdown',
    'iconOnly':true,
    'options':[
        {'value':'left','label':'左对齐','icon':icon},
        {'value':'center','label':'居中对齐','icon':center},
        {'value':'right','label':'右对齐','icon':right},
        {'value':'justify','label':'两端对齐','icon':justify}
    ],
    execute(editor,value){
        let commands = {
            'left':'justifyLeft',
            'center':'justifyCenter',
            'right':'justifyRight',
            'justify':'justifyFull'
        };
        if(commands[value]){
            editor.command(commands[value]);
        }
    },
    value(editor){
        let $element = editor.selectedElement();
        let value = $element ? window.getComputedStyle($element).textAlign : 'left';
        return ['center','right','justify'].includes(value) ? value : 'left';
    }
};
