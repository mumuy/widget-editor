// 用逻辑网格定位跨行、跨列的单元格，行列操作不依赖 cellIndex。
export function readTable(table){
    let rows = Array.from(table.rows);
    let grid = rows.map(()=>[]);
    let items = [];
    rows.forEach((row,y)=>{
        let x = 0;
        Array.from(row.cells).forEach(cell=>{
            while(grid[y][x]){
                x++;
            }
            let height = rows.slice(y).filter(item=>item.parentElement===row.parentElement).length;
            let item = {cell,row:y,column:x,rows:Math.min(cell.rowSpan||height,height),columns:cell.colSpan,group:row.parentElement};
            items.push(item);
            for(let i=y;i<y+item.rows;i++){
                for(let j=x;j<x+item.columns;j++){
                    grid[i][j] = item;
                }
            }
            x += item.columns;
        });
    });
    return {table,rows,grid,items,width:Math.max(0,...grid.map(row=>row.length))};
}

export function rectangle(model,first,last=first){
    let start = model.items.find(item=>item.cell===first);
    let end = model.items.find(item=>item.cell===last);
    if(!start||!end){
        return null;
    }
    let bounds = {
        top:Math.min(start.row,end.row),
        left:Math.min(start.column,end.column),
        bottom:Math.max(start.row+start.rows,end.row+end.rows),
        right:Math.max(start.column+start.columns,end.column+end.columns)
    };
    bounds.items = model.items.filter(item=>item.row<bounds.bottom&&item.row+item.rows>bounds.top&&
        item.column<bounds.right&&item.column+item.columns>bounds.left);
    bounds.complete = bounds.items.every(item=>item.row>=bounds.top&&item.row+item.rows<=bounds.bottom&&
        item.column>=bounds.left&&item.column+item.columns<=bounds.right&&item.group===start.group);
    for(let y=bounds.top;y<bounds.bottom;y++){
        for(let x=bounds.left;x<bounds.right;x++){
            if(!model.grid[y][x]){
                bounds.complete = false;
            }
        }
    }
    return bounds;
}

function createCell(model,row,column){
    let group = model.rows[row].parentElement;
    let cell = document.createElement(group.tagName==='THEAD'?'th':'td');
    cell.innerHTML = '<br>';
    if(cell.tagName==='TH'){
        cell.setAttribute('scope','col');
    }
    let item = {cell,row,column,rows:1,columns:1,group};
    model.items.push(item);
    return item;
}

function rebuild(model){
    model.rows.forEach(row=>row.replaceChildren());
    model.items.sort((a,b)=>a.row-b.row||a.column-b.column).forEach(item=>{
        ['rowspan','colspan'].forEach((name,index)=>{
            let value = index===0?item.rows:item.columns;
            if(value>1){
                item.cell.setAttribute(name,value);
            }else{
                item.cell.removeAttribute(name);
            }
        });
        model.rows[item.row].appendChild(item.cell);
    });
    if(!model.rows.length||!model.width){
        model.table.remove();
    }
}

export function insertRow(model,index,group){
    let row = document.createElement('tr');
    let next = model.rows[index];
    group.insertBefore(row,next?.parentElement===group?next:null);
    model.items.forEach(item=>{
        if(item.row<index&&item.row+item.rows>index&&item.group===group){
            item.rows++;
        }else if(item.row>=index){
            item.row++;
        }
    });
    model.rows.splice(index,0,row);
    for(let column=0;column<model.width;column++){
        if(!model.items.some(item=>item.row<=index&&item.row+item.rows>index&&item.column<=column&&item.column+item.columns>column)){
            createCell(model,index,column);
        }
    }
    rebuild(model);
    return row;
}

export function deleteRows(model,start,end){
    for(let index=end-1;index>=start;index--){
        model.items = model.items.filter(item=>{
            if(item.row===index&&item.rows===1){
                item.cell.remove();
                return false;
            }
            if(item.row<=index&&item.row+item.rows>index){
                item.rows--;
            }
            if(item.row>index){
                item.row--;
            }
            return true;
        });
        model.rows.splice(index,1)[0].remove();
    }
    rebuild(model);
}

export function insertColumn(model,index){
    model.items.forEach(item=>{
        if(item.column<index&&item.column+item.columns>index){
            item.columns++;
        }else if(item.column>=index){
            item.column++;
        }
    });
    model.rows.forEach((row,y)=>{
        if(!model.items.some(item=>item.row<=y&&item.row+item.rows>y&&item.column<=index&&item.column+item.columns>index)){
            createCell(model,y,index);
        }
    });
    model.width++;
    rebuild(model);
}

export function deleteColumns(model,start,end){
    for(let index=end-1;index>=start;index--){
        model.items = model.items.filter(item=>{
            if(item.column===index&&item.columns===1){
                item.cell.remove();
                return false;
            }
            if(item.column<=index&&item.column+item.columns>index){
                item.columns--;
            }
            if(item.column>index){
                item.column--;
            }
            return true;
        });
        model.width--;
    }
    rebuild(model);
}

export function mergeCells(model,bounds){
    if(!bounds.complete||bounds.items.length<2){
        return;
    }
    let first = bounds.items[0];
    // 按行保留内容，空单元格不产生多余换行。
    let contents = bounds.items.filter(item=>item.cell.textContent.trim()||item.cell.querySelector('img,table'));
    if(contents.length){
        let fragment = document.createDocumentFragment();
        contents.forEach((item,index)=>{
            if(index){
                fragment.appendChild(document.createElement('br'));
            }
            fragment.append(...item.cell.childNodes);
        });
        first.cell.replaceChildren(fragment);
    }else{
        first.cell.innerHTML = '<br>';
    }
    first.row = bounds.top;
    first.column = bounds.left;
    first.rows = bounds.bottom-bounds.top;
    first.columns = bounds.right-bounds.left;
    model.items = model.items.filter(item=>!bounds.items.includes(item)||item===first);
    rebuild(model);
    return first.cell;
}

export function splitCells(model,bounds){
    bounds.items.forEach(item=>{
        for(let row=item.row;row<item.row+item.rows;row++){
            for(let column=item.column;column<item.column+item.columns;column++){
                if(row!==item.row||column!==item.column){
                    let cell = createCell(model,row,column).cell;
                    if(cell.tagName!==item.cell.tagName){
                        let replacement = document.createElement(item.cell.tagName.toLowerCase());
                        replacement.innerHTML = '<br>';
                        model.items[model.items.length-1].cell = replacement;
                    }
                }
            }
        }
        item.rows = 1;
        item.columns = 1;
    });
    rebuild(model);
    return bounds.items[0].cell;
}
