import {readTable,rectangle,insertRow,deleteRows,insertColumn,deleteColumns,mergeCells,splitCells} from '../table/model.js';

const actions = new Set(['rowBefore','rowAfter','columnBefore','columnAfter','deleteRows','deleteColumns','merge','split']);

export function insertTable(editor,{rows=3,columns=3,header=true}={}){
    if(!Number.isInteger(rows)||!Number.isInteger(columns)||rows<1||rows>8||columns<1||columns>8){return false;}
    let html = '<table>'+(header?'<thead>':'<tbody>');
    for(let row=0;row<rows;row++){
        let tag = row===0&&header?'th':'td';
        html += '<tr>'+('<'+tag+'><br></'+tag+'>').repeat(columns)+'</tr>';
        if(row===0&&header){html += '</thead><tbody>';}
    }
    editor.insertHTML(html+'</tbody></table><p><br></p>');
}

export function editTable(editor,{action,first,last=first}={}){
    first ||= editor.selectedElement()?.closest('td,th');
    last ||= first;
    let table = first?.closest('table');
    if(!actions.has(action)||!table||!editor.content.contains(table)||last?.closest('table')!==table){return false;}
    let model = readTable(table);
    let area = rectangle(model,first,last);
    if(!area||action==='merge'&&(!area.complete||area.items.length<2)){return false;}
    return editor.transaction(()=>{
        let cell;
        let row = area.top;
        let column = area.left;
        if(action==='rowBefore'||action==='rowAfter'){
            let index = action==='rowBefore'?area.top:area.bottom;
            insertRow(model,index,model.rows[action==='rowBefore'?area.top:area.bottom-1].parentElement);
            row = index;
        }else if(action==='columnBefore'||action==='columnAfter'){
            column = action==='columnBefore'?area.left:area.right;
            insertColumn(model,column);
        }else if(action==='deleteRows'){
            deleteRows(model,area.top,area.bottom);
        }else if(action==='deleteColumns'){
            deleteColumns(model,area.left,area.right);
        }else if(action==='merge'){
            cell = mergeCells(model,area);
        }else if(action==='split'){
            cell = splitCells(model,area);
        }
        if(editor.content.contains(table)){
            let result = readTable(table);
            cell ||= result.grid[Math.min(row,result.rows.length-1)]?.[Math.min(column,result.width-1)]?.cell;
        }
        let range = document.createRange();
        range.selectNodeContents(cell&&editor.content.contains(cell)?cell:editor.content);
        range.collapse(!!cell);
        editor.selection.select(range);
        return cell||null;
    });
}
