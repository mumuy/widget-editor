export default {
    'name':'alignment',
    'label':'对齐方式',
    'type':'select',
    'options':[
        {'value':'left','label':'左对齐'},
        {'value':'center','label':'居中对齐'},
        {'value':'right','label':'右对齐'},
        {'value':'justify','label':'两端对齐'}
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
