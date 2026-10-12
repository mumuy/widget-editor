export default {
    'name':'fontSize',
    'label':'文字大小',
    'type':'dropdown',
    'options':[12,14,16,18,20,24,28,32,48].map((value)=>{
        return {'value':String(value),'label':value+' px'};
    }),
    execute(editor,value){
        if([12,14,16,18,20,24,28,32,48].includes(Number(value))){
            editor.applyStyle({'font-size':value+'px'});
        }
    },
    value(editor){
        let $element = editor.selectedElement();
        return $element ? String(parseFloat(window.getComputedStyle($element).fontSize)) : '16';
    },
    display(value){
        return value+' px';
    }
};
