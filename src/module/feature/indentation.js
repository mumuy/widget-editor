import {indentIncrease,indentDecrease} from '../icon.js';

function blocks(editor){
    let range = editor.getRange();
    if(!range||range.collapsed){
        let block = editor.selectedElement()?.closest('p,h1,h2,h3,h4,h5,h6,li,td,th');
        return block&&editor.content.contains(block)?[block]:[];
    }
    let selected = editor.selectedBlocks().filter(block=>block.tagName!=='DIV');
    return selected.filter(block=>!selected.some(other=>other!==block&&block.contains(other)));
}

export default {
    'name':'indentation',
    'label':'缩进',
    'icon':indentIncrease,
    'type':'dropdown',
    'actionMenu':true,
    'iconOnly':true,
    'options':[
        {'value':'increase','label':'增加缩进','icon':indentIncrease},
        {'value':'decrease','label':'减少缩进','icon':indentDecrease}
    ],
    disabled(editor,value){
        let selected = blocks(editor);
        return value==='increase'?selected.length>0&&selected.every(block=>block.style.textIndent==='2em'):
            !selected.some(block=>block.style.textIndent==='2em');
    },
    execute(editor,value){
        if(!['increase','decrease'].includes(value)||this.disabled(editor,value)){
            return;
        }
        editor.transaction(()=>{
            blocks(editor).forEach(block=>{
                if(value==='increase'){
                    block.style.textIndent = '2em';
                }else{
                    block.style.removeProperty('text-indent');
                    if(!block.style.length){
                        block.removeAttribute('style');
                    }
                }
            });
        });
    }
};
