// 表单值、校验和禁用状态由原生 ElementInternals 管理。
export default class EditorForm {
    constructor(editor){
        this.editor = editor;
        this.internals = editor.attachInternals();
        this.disabled = false;
        this.initialValue = null;
        editor.addEventListener('focus',()=>{
            if(!editor.shadowRoot.activeElement){
                editor.focus({preventScroll:true});
            }
        });
    }
    initialize(value){
        if(this.initialValue===null){
            this.initialValue = value;
        }
        // 可被关联的 label 聚焦，不增加工具栏之外的 Tab 停靠点。
        if(!this.editor.hasAttribute('tabindex')){
            this.editor.tabIndex = -1;
        }
    }
    update(value){
        let editor = this.editor;
        if(!editor.content){return;}
        value = value??editor.value;
        this.internals.setFormValue(value,value);
        let missing = false;
        if(editor.required&&!editor.getText(value).replace(/[\s\u200b-\u200d\ufeff]/g,'')){
            let template = document.createElement('template');
            template.innerHTML = value;
            missing = !template.content.querySelector('img,video,audio,iframe,table,hr');
        }
        let message = missing?editor.t('请填写内容'):'';
        this.internals.setValidity({valueMissing:missing},message,
            editor.source?editor.sourceArea:editor.content);
        editor.content.setAttribute('aria-required',String(editor.required));
        editor.sourceArea.required = editor.required;
    }
    setDisabled(disabled){
        this.disabled = disabled;
        let editor = this.editor;
        if(!editor.content){return;}
        editor.content.contentEditable = String(!disabled);
        editor.content.tabIndex = disabled?-1:0;
        editor.content.setAttribute('aria-disabled',String(disabled));
        editor.sourceArea.disabled = disabled;
        editor.panel.querySelector('.hd').inert = disabled;
        editor.footer.inert = disabled;
        if(disabled){
            editor._dialog?.dismiss();
            editor.dropdown.close();
            editor.table?.dismiss();
            editor.links?.dismiss();
            editor.images?.dismiss();
            editor.codes?.dismiss();
            editor.cancelPainter();
            editor.tooltip?.hide();
            editor.mobile?.close();
            editor.fullscreen?.close();
            editor.shadowRoot.activeElement?.blur();
        }
        editor.updateToolbar();
        this.update();
    }
}
