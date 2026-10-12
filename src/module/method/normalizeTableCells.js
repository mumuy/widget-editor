const emptyTags = new Set('BR SPAN STRONG B EM I U'.split(' '));

export default function normalizeTableCells(content,editing=false){
    content.querySelectorAll('td,th').forEach(cell=>{
        let empty = !cell.textContent.replace(/\u200b/g,'').trim()&&
            Array.from(cell.querySelectorAll('*')).every(node=>emptyTags.has(node.tagName));
        if(empty){
            if(editing){
                // 载入的空白占位交给浏览器编辑，输入文字时不会残留 nbsp。
                if(!cell.children.length){
                    cell.replaceChildren(document.createElement('br'));
                }
            }else{
                cell.textContent = '\u00a0';
            }
        }else if(!editing&&!cell.children.length){
            // 纯文本中的源码缩进与换行按 HTML 空白规则整理，单元格保持一行。
            cell.textContent = cell.textContent.replace(/[ \t\r\n\f]+/g,' ').replace(/^ +| +$/g,'');
        }
    });
}
