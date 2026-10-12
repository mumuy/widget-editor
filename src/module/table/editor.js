import {readTable,rectangle,insertRow,deleteRows,insertColumn,deleteColumns,mergeCells,splitCells} from './model.js';

const actions = [
    ['rowBefore','上方插行','M3 10h18v10H3zM12 2v6M9 5h6'],
    ['rowAfter','下方插行','M3 4h18v10H3zM12 16v6M9 19h6'],
    ['columnBefore','左侧插列','M10 3h10v18H10zM2 12h6M5 9v6'],
    ['columnAfter','右侧插列','M4 3h10v18H4zM16 12h6M19 9v6'],
    ['deleteRows','删除行','M3 3h18v18H3zM3 9h18M3 15h18M8 12h8'],
    ['deleteColumns','删除列','M3 3h18v18H3zM9 3v18M15 3v18M11 8l2 8M13 8l-2 8'],
    ['merge','合并单元格','M3 3h18v18H3zM4 12h6m-3-3 3 3-3 3M20 12h-6m3-3-3 3 3 3'],
    ['split','拆分单元格','M3 3h18v18H3zM12 3v18M10 12H5m2-2-2 2 2 2M14 12h5m-2-2 2 2-2 2']
];

export default class TableEditor {
    constructor(editor){
        this.editor = editor;
        this.first = null;
        this.last = null;
        this.dragging = false;
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'table-toolbar';
        this.toolbar.hidden = true;
        this.toolbar.setAttribute('role','toolbar');
        this.toolbar.setAttribute('aria-label','表格编辑');
        this.toolbar.innerHTML = `<span class="table-selection"></span><div class="table-actions">${actions.map(action=>{
            return `<button type="button" data-table-action="${action[0]}" title="${action[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${action[2]}"/></svg>${action[1]}</button>`;
        }).join('')}</div><span class="table-help">拖动或 Shift 点击选格</span>`;
        editor.shadowRoot.querySelector('.ft').before(this.toolbar);
        this.toolbar.addEventListener('pointerdown',event=>{
            if(event.target.closest('button')){
                editor.saveSelection();
                event.preventDefault();
            }
        });
        this.toolbar.addEventListener('click',event=>{
            let button = event.target.closest('button');
            if(button&&!button.disabled){
                this.execute(button.dataset.tableAction);
            }
        });
        editor.content.addEventListener('pointerdown',event=>{
            if(event.button!==0){
                return;
            }
            let cell = this.cell(event.target);
            if(!cell){
                this.clear();
                return;
            }
            let first = event.shiftKey&&this.first?.closest('table')===cell.closest('table')?this.first:cell;
            this.select(first,cell);
            this.dragging = !event.shiftKey;
            if(event.shiftKey){
                event.preventDefault();
                this.focus(cell);
            }
        });
        editor.content.addEventListener('pointerover',event=>{
            if(!this.dragging){
                return;
            }
            if(event.buttons!==1){
                this.dragging = false;
                return;
            }
            let cell = this.cell(event.target);
            if(cell&&cell!==this.last&&cell.closest('table')===this.first?.closest('table')){
                event.preventDefault();
                this.select(this.first,cell);
                this.focus(cell);
            }
        });
        editor.shadowRoot.addEventListener('pointerup',()=>{
            if(this.dragging&&this.first!==this.last){
                this.focus(this.last);
            }
            this.dragging = false;
        });
        editor.content.addEventListener('keydown',event=>{
            if(event.key==='Escape'&&this.first){
                this.clear();
            }
        });
    }
    cell(node){
        let cell = node?.closest?.('td,th');
        return cell&&this.editor.content.contains(cell)?cell:null;
    }
    bounds(){
        let table = this.first?.closest('table');
        if(!table||!this.editor.content.contains(table)||!table.contains(this.last)){
            return null;
        }
        let model = readTable(table);
        return {model,area:rectangle(model,this.first,this.last)};
    }
    clear(){
        this.editor.content.querySelectorAll('[data-table-selected]').forEach(cell=>cell.removeAttribute('data-table-selected'));
        this.first = null;
        this.last = null;
        this.dragging = false;
        this.toolbar.hidden = true;
    }
    select(first,last=first){
        let dragging = this.dragging;
        this.clear();
        this.dragging = dragging;
        this.first = first;
        this.last = last;
        this.paint();
    }
    paint(){
        let selection = this.bounds();
        if(!selection?.area){
            this.clear();
            return;
        }
        let {area} = selection;
        area.items.forEach(item=>item.cell.setAttribute('data-table-selected',''));
        this.toolbar.hidden = false;
        this.toolbar.querySelector('.table-selection').textContent = area.items.length+' 个单元格';
        this.toolbar.querySelector('[data-table-action="merge"]').disabled = !area.complete||area.items.length<2;
        this.toolbar.querySelector('[data-table-action="split"]').disabled = !area.items.some(item=>item.rows>1||item.columns>1);
    }
    refresh(){
        if(this.editor.source||this.first&&!this.editor.content.contains(this.first)){
            this.clear();
        }
        if(this.editor.source){
            return;
        }
        let cell = this.cell(this.editor.selectedElement());
        if(cell){
            let selection = this.bounds();
            if(!selection?.area?.items.some(item=>item.cell===cell)){
                this.select(cell);
            }else{
                this.paint();
            }
        }else if(this.editor.selection.current()){
            this.clear();
        }
    }
    focus(cell){
        if(!cell||!this.editor.content.contains(cell)){
            return;
        }
        let range = document.createRange();
        range.selectNodeContents(cell);
        range.collapse(true);
        this.editor.selection.range = range;
        this.editor.restoreSelection();
    }
    execute(action){
        let selection = this.bounds();
        if(!selection?.area||this.editor.source){
            return;
        }
        let {model,area} = selection;
        if(action==='merge'&&(!area.complete||area.items.length<2)){
            return;
        }
        this.editor.history.record();
        this.editor.transaction(()=>{
            this.clear();
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
            if(this.editor.content.contains(model.table)){
                let result = readTable(model.table);
                cell = cell||result.grid[Math.min(row,result.rows.length-1)]?.[Math.min(column,result.width-1)]?.cell;
            }
            if(cell&&this.editor.content.contains(cell)){
                this.select(cell);
                this.focus(cell);
            }else{
                let range = document.createRange();
                range.selectNodeContents(this.editor.content);
                range.collapse(false);
                this.editor.selection.range = range;
                this.editor.restoreSelection();
            }
        });
    }
}
