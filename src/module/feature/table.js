import {table as icon} from '../icon.js';
import tablePicker from '../table/picker.js';
import TableEditor from '../table/editor.js';

export default {
    'name':'table',
    'icon':icon,
    'label':'插入表格',
    'type':'button',
    bind(editor){
        editor.table = new TableEditor(editor);
    },
    execute(editor){
        let rows = 3;
        let columns = 3;
        editor.openDialog({
            'title':'插入表格',
            'fields':[
                {'name':'header','label':'第一行作为表头','type':'checkbox','value':true}
            ],
            'submitLabel':'插入表格',
            mount(dialog){
                tablePicker(editor,dialog,(row,column)=>{
                    rows = row;
                    columns = column;
                });
            },
            onSubmit(values){
                editor.command('insertTable',{rows,columns,header:values.header});
                return true;
            }
        });
    }
};
