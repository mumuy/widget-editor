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
        this.shiftSelecting = false;
        this.point = null;
        this.dismissed = false;
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'table-toolbar';
        this.toolbar.hidden = true;
        this.toolbar.setAttribute('role','toolbar');
        this.toolbar.setAttribute('aria-label','表格编辑');
        this.toolbar.setAttribute('popover','manual');
        this.toolbar.innerHTML = `<div class="table-actions">${actions.map(action=>{
            return `<button type="button" data-table-action="${action[0]}" aria-label="${action[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${action[2]}"/></svg>${action[1]}</button>`;
        }).join('')}</div>`;
        editor.shadowRoot.appendChild(this.toolbar);
        editor.locale.apply(this.toolbar);
        this.onOutside = event=>{
            let path = event.composedPath();
            if(!path.includes(this.toolbar)&&!path.some(node=>this.cell(node))){
                this.dismiss();
            }
        };
        this.onScroll = event=>{
            if(!(event.target instanceof Node)||!this.toolbar.contains(event.target)){
                this.dismiss();
            }
        };
        this.onPointerUp = event=>{
            if(!this.dragging){
                return;
            }
            let cell = event.composedPath().find(node=>this.cell(node));
            if(cell){
                this.point = {x:event.clientX,y:event.clientY};
            }
            if(this.first!==this.last){
                this.focus(this.last);
            }
            this.dragging = false;
            this.paint();
        };
        this.onKey = event=>{
            if(event.key==='Shift'){
                this.shiftSelecting = event.type==='keydown';
                if(this.shiftSelecting){
                    this.hide();
                }else if(this.first&&!this.dismissed){
                    this.paint();
                }
            }
        };
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
                this.dismiss();
                return;
            }
            let first = event.shiftKey&&this.first?.closest('table')===cell.closest('table')?this.first:cell;
            this.dragging = !event.shiftKey;
            this.point = {x:event.clientX,y:event.clientY};
            this.select(first,cell);
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
                this.point = {x:event.clientX,y:event.clientY};
                this.select(this.first,cell);
                this.focus(cell);
            }
        });
        editor.content.addEventListener('keydown',event=>{
            if(event.key==='Escape'&&this.first){
                this.dismiss();
            }else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(event.key)){
                this.dismissed = false;
                this.point = null;
            }
        });
        this.toolbar.addEventListener('keydown',event=>{
            if(event.key==='Escape'){
                event.preventDefault();
                this.dismiss();
                editor.restoreSelection();
            }
        });
    }
    connect(){
        document.addEventListener('pointerdown',this.onOutside);
        document.addEventListener('pointerup',this.onPointerUp);
        document.addEventListener('keydown',this.onKey);
        document.addEventListener('keyup',this.onKey);
        window.addEventListener('scroll',this.onScroll,true);
        window.addEventListener('resize',this.onScroll);
        this.editor.shadowRoot.addEventListener('scroll',this.onScroll,true);
    }
    disconnect(){
        this.dismiss();
        this.shiftSelecting = false;
        document.removeEventListener('pointerdown',this.onOutside);
        document.removeEventListener('pointerup',this.onPointerUp);
        document.removeEventListener('keydown',this.onKey);
        document.removeEventListener('keyup',this.onKey);
        window.removeEventListener('scroll',this.onScroll,true);
        window.removeEventListener('resize',this.onScroll);
        this.editor.shadowRoot.removeEventListener('scroll',this.onScroll,true);
    }
    cell(node){
        if(this.editor.formControl.disabled){return null;}
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
        this.point = null;
        this.hide();
    }
    hide(){
        if(this.toolbar.matches(':popover-open')){
            this.toolbar.hidePopover();
        }
        this.toolbar.hidden = true;
    }
    dismiss(){
        this.dismissed = true;
        this.clear();
    }
    select(first,last=first){
        let dragging = this.dragging;
        let point = this.point;
        this.clear();
        this.dragging = dragging;
        this.point = point;
        this.dismissed = false;
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
        this.toolbar.querySelector('[data-table-action="merge"]').disabled = !area.complete||area.items.length<2;
        this.toolbar.querySelector('[data-table-action="split"]').disabled = !area.items.some(item=>item.rows>1||item.columns>1);
        // 拖选结束后再显示，浮层不会挡住要选择的单元格。
        if(!this.dragging&&!this.shiftSelecting){
            this.show(area);
        }
    }
    show(area){
        if(!this.editor.isConnected){
            return;
        }
        this.toolbar.hidden = false;
        if(!this.toolbar.matches(':popover-open')){
            this.toolbar.showPopover();
        }
        let cell = this.last.getBoundingClientRect();
        let point = this.point||{x:cell.left,y:cell.bottom};
        let rect = this.toolbar.getBoundingClientRect();
        let width = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight;
        let selected = area.items.reduce((bounds,item)=>{
            let box = item.cell.getBoundingClientRect();
            return {left:Math.min(bounds.left,box.left),right:Math.max(bounds.right,box.right),
                top:Math.min(bounds.top,box.top),bottom:Math.max(bounds.bottom,box.bottom)};
        },cell);
        let overlap = (left,top,box)=>Math.max(0,Math.min(left+rect.width,box.right)-Math.max(left,box.left))*
            Math.max(0,Math.min(top+rect.height,box.bottom)-Math.max(top,box.top));
        // 先避开当前单元格，再避开整个选区；同等位置优先靠近鼠标。
        let positions = [selected,cell].flatMap(box=>[
            [point.x+12,box.bottom+12],[point.x+12,box.top-rect.height-12],
            [box.right+12,point.y+12],[box.left-rect.width-12,point.y+12]
        ]).map(([left,top])=>{
            left = Math.max(8,Math.min(left,width-rect.width-8));
            top = Math.max(8,Math.min(top,height-rect.height-8));
            return {left,top,current:overlap(left,top,cell),selected:overlap(left,top,selected),
                distance:Math.hypot(Math.max(left-point.x,0,point.x-left-rect.width),
                    Math.max(top-point.y,0,point.y-top-rect.height))};
        });
        positions.sort((a,b)=>a.current-b.current||a.selected-b.selected||a.distance-b.distance);
        this.toolbar.style.left = positions[0].left+'px';
        this.toolbar.style.top = positions[0].top+'px';
    }
    refresh(){
        if(this.editor.formControl.disabled){this.dismiss();return;}
        if(this.editor.source||this.first&&!this.editor.content.contains(this.first)){
            this.clear();
        }
        if(this.editor.source||this.dismissed||this.dragging){
            return;
        }
        let cell = this.cell(this.editor.selectedElement());
        if(cell){
            let selection = this.bounds();
            if(!selection?.area?.items.some(item=>item.cell===cell)){
                this.point = null;
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
        let point = this.point;
        this.editor.transaction(()=>{
            this.clear();
            this.point = point;
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
