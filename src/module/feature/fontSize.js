const sizes = [12,14,16,18,20,24,28,32,36,48];

export default {
    'name':'fontSize',
    'label':'文字大小',
    'type':'dropdown',
    options(editor){
        return editor.config.options('fontSize',sizes.map(value=>{
            return {'value':String(value),'label':value+' px'};
        }));
    },
    execute(editor,value){
        if(sizes.includes(Number(value))){
            editor.applyStyle({'font-size':value+'px'});
        }
    },
    value(editor){
        let $element = editor.selectedElement();
        // 上下标按正文的字号显示，避免浏览器缩小后的字号出现小数。
        for(let $parent=$element;$parent&&$parent!==editor.content;$parent=$parent.parentElement){
            if($parent.style.fontSize){
                break;
            }
            if($parent.matches('sup,sub')){
                $element = $parent.parentElement;
            }
        }
        return $element ? String(parseFloat(window.getComputedStyle($element).fontSize)) : '16';
    },
    display(value){
        return value+' px';
    }
};
