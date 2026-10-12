export default {
    'name':'heading',
    'label':'标题',
    'type':'select',
    'options':[
        {'value':'p','label':'正文'},
        {'value':'h1','label':'标题 1'},
        {'value':'h2','label':'标题 2'},
        {'value':'h3','label':'标题 3'},
        {'value':'h4','label':'标题 4'},
        {'value':'h5','label':'标题 5'},
        {'value':'h6','label':'标题 6'}
    ],
    execute(editor,value){
        if(/^(p|h[1-6])$/.test(value)){
            editor.command('formatBlock','<'+value+'>');
        }
    },
    value(editor){
        let $element = editor.selectedElement();
        while($element && $element!==editor.content){
            let name = $element.tagName.toLowerCase();
            if(/^(p|h[1-6])$/.test(name)){
                return name;
            }
            $element = $element.parentElement;
        }
        return 'p';
    }
};
