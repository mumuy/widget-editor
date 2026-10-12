import {indentIncrease as icon} from '../icon.js';

function blocks(editor){
    let range = editor.getRange();
    if(!range||range.collapsed){
        let block = editor.selectedElement()?.closest('p,h1,h2,h3,h4,h5,h6,li,td,th');
        return block&&editor.content.contains(block)?[block]:[];
    }
    let selected = editor.selectedBlocks().filter(block=>block.tagName!=='DIV');
    return selected.filter(block=>!selected.some(other=>other!==block&&block.contains(other)));
}

function indented(block){
    return parseFloat(window.getComputedStyle(block).textIndent)>0;
}

export default {
    'name':'indentation',
    'label':'缩进',
    'icon':icon,
    'type':'button',
    execute(editor){
        editor.transaction(()=>{
            let selected = blocks(editor);
            let remove = selected.length>0&&selected.every(indented);
            selected.forEach(block=>{
                if(remove){
                    block.style.removeProperty('text-indent');
                    // 对继承的缩进使用零值覆盖，只取消当前段落的缩进。
                    if(indented(block)){
                        block.style.textIndent = '0px';
                    }
                    if(!block.style.length){
                        block.removeAttribute('style');
                    }
                }else{
                    block.style.textIndent = '2em';
                }
            });
        });
    },
    active(editor){
        let selected = blocks(editor);
        return selected.length>0&&selected.every(indented);
    }
};
