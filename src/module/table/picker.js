export default function tablePicker(dialog,onChange){
    dialog.classList.add('table-dialog');
    let picker = document.createElement('div');
    picker.className = 'table-picker';
    picker.innerHTML = '<p class="table-size" role="status" aria-live="polite"></p><div class="table-grid" role="group" aria-label="选择表格行列，方向键移动，回车插入"></div>';
    let grid = picker.querySelector('.table-grid');
    let cells = [];
    let select = function(row,column){
        onChange(row,column);
        picker.querySelector('.table-size').textContent = column+' 列 × '+row+' 行';
        cells.forEach(cell=>{
            let active = Number(cell.dataset.row)<=row&&Number(cell.dataset.column)<=column;
            cell.classList.toggle('active',active);
            cell.tabIndex = Number(cell.dataset.row)===row&&Number(cell.dataset.column)===column?0:-1;
        });
    };
    for(let row=1;row<=10;row++){
        for(let column=1;column<=10;column++){
            let cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'table-grid-cell';
            cell.dataset.row = row;
            cell.dataset.column = column;
            cell.setAttribute('aria-label',column+' 列 × '+row+' 行');
            cell.addEventListener('pointerenter',()=>select(row,column));
            cell.addEventListener('focus',()=>select(row,column));
            cell.addEventListener('click',()=>{
                select(row,column);
                dialog.querySelector('form').requestSubmit();
            });
            cell.addEventListener('keydown',event=>{
                let offsets = {ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
                let offset = offsets[event.key];
                if(offset){
                    event.preventDefault();
                    let y = Math.max(1,Math.min(10,row+offset[0]));
                    let x = Math.max(1,Math.min(10,column+offset[1]));
                    cells[(y-1)*10+x-1].focus({preventScroll:true});
                }
            });
            cells.push(cell);
            grid.appendChild(cell);
        }
    }
    dialog.querySelector('.dialog-body').prepend(picker);
    select(3,3);
}
