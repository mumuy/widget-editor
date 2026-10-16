export default function tablePicker(editor,dialog,onChange){
    dialog.classList.add('table-dialog');
    let picker = document.createElement('div');
    picker.className = 'table-picker';
    picker.innerHTML = '<p class="table-size" role="status" aria-live="polite"></p><div class="table-grid" role="group" aria-label="选择表格行列，方向键移动，回车确认范围，通过插入表格按钮完成插入"></div>';
    let grid = picker.querySelector('.table-grid');
    let cells = [];
    let selectedRow = 3;
    let selectedColumn = 3;
    let confirmed = false;
    let select = function(row,column){
        selectedRow = row;
        selectedColumn = column;
        onChange(row,column);
        editor.locale.set(picker.querySelector('.table-size'),confirmed?'{columns} 列 × {rows} 行（已确认）':'{columns} 列 × {rows} 行',{columns:column,rows:row});
        cells.forEach(({cell,row:y,column:x})=>{
            let active = y<=row&&x<=column;
            cell.classList.toggle('active',active);
            cell.tabIndex = y===row&&x===column?0:-1;
        });
    };
    for(let row=1;row<=8;row++){
        for(let column=1;column<=8;column++){
            let cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'table-grid-cell';
            editor.locale.set(cell,'{columns} 列 × {rows} 行',{columns:column,rows:row},'aria-label');
            cell.addEventListener('pointerenter',event=>{
                if(event.pointerType==='touch'||confirmed&&(row>selectedRow||column>selectedColumn)){
                    return;
                }
                confirmed = false;
                select(row,column);
            });
            cell.addEventListener('click',event=>{
                // 鼠标在范围外点击不改变已确认的选择；触屏及键盘可直接选择。
                if(confirmed&&(row>selectedRow||column>selectedColumn)&&event.detail&&event.pointerType!=='touch'){
                    return;
                }
                confirmed = true;
                select(row,column);
            });
            cell.addEventListener('keydown',event=>{
                let offsets = {ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
                let offset = offsets[event.key];
                if(offset){
                    event.preventDefault();
                    let y = Math.max(1,Math.min(8,row+offset[0]));
                    let x = Math.max(1,Math.min(8,column+offset[1]));
                    confirmed = false;
                    select(y,x);
                    cells[(y-1)*8+x-1].cell.focus({preventScroll:true});
                }
            });
            cells.push({cell,row,column});
            grid.appendChild(cell);
        }
    }
    dialog.querySelector('.dialog-body').prepend(picker);
    select(3,3);
}
