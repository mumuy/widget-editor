import {table as icon} from '../icon.js';

export default {
    'name':'table',
    'icon':icon,
    'label':'插入表格',
    'type':'button',
    execute(editor){
        editor.openDialog({
            'title':'插入表格',
            'fields':[
                {'name':'rows','label':'行数','type':'number','value':3,'min':1,'max':10,'required':true},
                {'name':'columns','label':'列数','type':'number','value':3,'min':1,'max':10,'required':true},
                {'name':'header','label':'第一行作为表头','type':'checkbox','value':true}
            ],
            'submitLabel':'插入表格',
            onSubmit(values){
                let rows = Number(values.rows);
                let columns = Number(values.columns);
                if(!Number.isInteger(rows) || !Number.isInteger(columns) ||
                    rows<1 || rows>10 || columns<1 || columns>10){
                    editor.notify('行数和列数必须是 1 到 10 之间的整数');
                    return false;
                }
                let html = '<table><tbody>';
                for(let row=0;row<rows;row++){
                    let tag = row===0 && values.header ? 'th' : 'td';
                    html += '<tr>';
                    for(let column=0;column<columns;column++){
                        html += '<'+tag+'><br></'+tag+'>';
                    }
                    html += '</tr>';
                }
                html += '</tbody></table><p><br></p>';
                editor.insertHTML(html);
                return true;
            }
        });
    }
};
