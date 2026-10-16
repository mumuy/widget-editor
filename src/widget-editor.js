import EditorSelection from './module/method/selection.js';
import sanitizeHTML,{setLinkTarget} from './module/method/sanitize.js';
import {createFormatter} from './module/method/formatHTML.js';
import EditorClipboard from './module/clipboard.js';
import EditorImage from './module/image.js';
import applyStyle from './module/method/applyStyle.js';
import normalizeParagraphs from './module/method/normalizeParagraphs.js';
import normalizeTableCells from './module/method/normalizeTableCells.js';
import EditorConfig,{observedAttributes,toolbarAttributes,mediaAttributes} from './module/config.js';
import EditorHistory from './module/history.js';
import EditorNormalizer from './module/normalizer.js';
import EditorForm from './module/form.js';
import EditorBlocks from './module/blocks.js';
import EditorToolbar from './module/toolbar.js';
import openDialog from './module/dialog.js';
import EditorDropdown from './module/dropdown.js';
import EditorTooltip from './module/tooltip.js';
import EditorFullscreen from './module/fullscreen.js';
import EditorLanguage from './module/language/index.js';
import styleSheet from './style/default.css' with { type: 'css'};

class WidgetEditor extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode:'open'});
        this.formControl = new EditorForm(this);
        this.config = new EditorConfig(this);
        this.tools = new EditorToolbar(this);
        this.locale = new EditorLanguage(this);
        this.source = false;
        this.painter = null;
        this._initialized = false;
        this._pendingValue = null;
        this._formatHTML = createFormatter();
        this._onSelection = ()=>{
            if(this._composing){return;}
            if(this.selection?.current()){
                this.saveSelection();
                this.scheduleToolbarUpdate();
            }else{
                this.links?.refresh();
                this.codes?.refresh();
            }
        };
    }
    static get observedAttributes(){
        return observedAttributes;
    }
    static get formAssociated(){
        return true;
    }
    connectedCallback(){
        if(!this._initialized){
            this.render();
            this.addStyle();
            this._initialized = true;
            this.selection = new EditorSelection(this);
            this.blocks = new EditorBlocks(this);
            this.history = new EditorHistory(this);
            this.dropdown = new EditorDropdown(this);
            this.formControl.initialize(this._pendingValue===null?this.innerHTML:this._pendingValue);
            this.value = this._pendingValue===null?this.innerHTML:this._pendingValue;
            this.normalizer = new EditorNormalizer(this);
            this.images = new EditorImage(this);
            this.clipboard = new EditorClipboard(this);
            this.bindEvents();
            this.tooltip = new EditorTooltip(this);
            this.fullscreen = new EditorFullscreen(this);
            this.formControl.setDisabled(this.formControl.disabled||this.disabled);
            this.attributeChangedCallback();
            this.dispatchEvent(new CustomEvent('ready',{bubbles:true,composed:true}));
        }
        this.normalizer.connect();
        this.dropdown.connect();
        this.table?.connect();
        this.links.connect();
        this.images.connect();
        this.codes.connect();
        this.tooltip.connect();
        this.fullscreen.connect();
        this.mobile.connect();
        document.addEventListener('selectionchange',this._onSelection);
    }
    disconnectedCallback(){
        cancelAnimationFrame(this._toolbarFrame);
        this._toolbarFrame = null;
        this.mobile?.disconnect();
        this.fullscreen?.disconnect();
        this.dropdown?.disconnect();
        this.normalizer?.disconnect();
        this.table?.disconnect();
        this.links?.disconnect();
        this.images?.disconnect();
        this.codes?.disconnect();
        this.tooltip?.disconnect();
        document.removeEventListener('selectionchange',this._onSelection);
        this._dialog?.dismiss();
    }
    formDisabledCallback(disabled){
        this.formControl.setDisabled(disabled);
    }
    formResetCallback(){
        this.value = this.formControl.initialValue;
    }
    formStateRestoreCallback(state){
        if(this.formControl.initialValue===null){
            this.formControl.initialize(this.value);
        }
        this.value = state;
    }
    attributeChangedCallback(name,oldValue,newValue){
        if(!this.content||name&&oldValue===newValue){
            return;
        }
        if(name==='language'){
            this.updateLocale();
            this.formControl.update();
            this.links?.refresh();
            this.tooltip?.refresh();
            return;
        }
        if(['name','form','required'].includes(name)){
            this.formControl.update();
            return;
        }
        if(name==='disabled'){return;}
        if(name?.endsWith('-limit')){
            if(this._dialog?.dataset.insert===name.slice(0,-6)){this._dialog.dismiss();}
            return;
        }
        if(toolbarAttributes.includes(name)&&this.dropdown){
            this.saveSelection();
            this.dropdown.close();
            this.tooltip?.hide();
            if(mediaAttributes.includes(name)&&this._dialog?.dataset.insert===name){
                this._dialog.dismiss();
            }
            this.toolbar.innerHTML = this.tools.render();
            this.tools.items.forEach(feature=>feature.bindToolbar?.(this));
            this.locale.apply(this.toolbar);
            if(this._dialog?.dataset.insert&&this._dialog.dataset.insertSource!=='api'&&!this.canInsert(this._dialog.dataset.insert)){
                this._dialog.dismiss();
            }
            this.updateToolbar();
        }
        if(!name||toolbarAttributes.includes(name)){
            this.tools.updateView();
        }
        this.updatePlaceholder();
        this.style.setProperty('--editor-height',this.config.get('height')+'px');
        this.updateLocale();
    }
    get value(){
        if(!this._initialized){
            return this._pendingValue===null?this.innerHTML:this._pendingValue;
        }
        return this.formatValue(this.source?this.sourceArea.value:this.contentHTML());
    }
    set value(value){
        if(!this._initialized){
            this._pendingValue = String(value||'');
            return;
        }
        this._dialog?.dismiss();
        this._composing = false;
        this._compositionHTML = null;
        this.content.innerHTML = sanitizeHTML(value);
        normalizeTableCells(this.content,true);
        this.sourceArea.value = this.formatValue(this.content.innerHTML);
        this.selection.range = null;
        this.normalizeContent(false,null);
        this.cancelPainter();
        this.history.reset();
        this.update(false,false);
    }
    get text(){
        return this.getText();
    }
    get name(){
        return this.getAttribute('name')||'';
    }
    set name(value){
        this.setAttribute('name',value);
    }
    get disabled(){
        return this.hasAttribute('disabled');
    }
    set disabled(value){
        this.toggleAttribute('disabled',!!value);
    }
    get required(){
        return this.hasAttribute('required');
    }
    set required(value){
        this.toggleAttribute('required',!!value);
    }
    get form(){
        return this.formControl.internals.form;
    }
    get labels(){
        return this.formControl.internals.labels;
    }
    focus(options){
        if(!this.formControl.disabled){
            (this.source?this.sourceArea:this.content)?.focus(options);
        }
    }
    formatValue(html){
        if(this._formatted?.html!==html){
            this._formatted = {html,value:this._formatHTML(html)};
        }
        return this._formatted.value;
    }
    getText(value=this.value){
        if(value===this._formatted?.value&&this._formatted.text!==undefined){return this._formatted.text;}
        let template = document.createElement('template');
        template.innerHTML = value;
        let text = (template.content.textContent||'').replace(/\u200b/g,'');
        if(value===this._formatted?.value){this._formatted.text = text;}
        return text;
    }
    getHTML(){
        return this.value;
    }
    contentHTML(){
        if(!this.content.querySelector('[data-table-selected],[data-code-placeholder],[data-block-boundary]')){
            return this.content.innerHTML;
        }
        let content = this.content.cloneNode(true);
        content.querySelectorAll('[data-table-selected]').forEach(cell=>cell.removeAttribute('data-table-selected'));
        content.querySelectorAll('pre code br[data-code-placeholder]').forEach(node=>node.remove());
        content.querySelectorAll('[data-block-boundary]').forEach(node=>{
            if(this.blocks.boundary(node)){
                node.remove();
            }else{
                node.removeAttribute('data-block-boundary');
            }
        });
        return content.innerHTML;
    }
    setHTML(value){
        this.value = value;
    }
    addStyle(){
        this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }
    render(){
        let toolbar = this.tools.render();
        this.shadowRoot.innerHTML = `<div class="mod-panel">
            <div class="hd">
                <div class="toolbar" role="toolbar" aria-label="文本格式工具栏">${toolbar}</div>
            </div>
            <div class="bd">
                <div class="editor-content" contenteditable="true" role="textbox" aria-label="富文本内容" aria-multiline="true" spellcheck="true"></div>
                <div class="editor-placeholder" aria-hidden="true" hidden></div>
                <textarea class="editor-source" aria-label="HTML 源代码" spellcheck="false" hidden></textarea>
            </div>
            <div class="ft">
                ${this.tools.renderView()}
                <span class="word-count">0 字</span>
            </div>
        </div>`;
        this.panel = this.shadowRoot.querySelector('.mod-panel');
        this.body = this.panel.querySelector('.bd');
        this.content = this.shadowRoot.querySelector('.editor-content');
        this.placeholder = this.shadowRoot.querySelector('.editor-placeholder');
        this.sourceArea = this.shadowRoot.querySelector('.editor-source');
        this.toolbar = this.shadowRoot.querySelector('.toolbar');
        this.footer = this.shadowRoot.querySelector('.ft');
        this.sourceButton = this.footer.querySelector('[data-action="source"]');
        this.wordCount = this.footer.querySelector('.word-count');
    }
    bindEvents(){
        this.tools.features.forEach(feature=>feature.bind?.(this));
        this.tools.items.forEach(feature=>feature.bindToolbar?.(this));
        this.toolbar.addEventListener('pointerdown',event=>{
            let control = event.target.closest('[data-action]');
            this.saveSelection();
            if(control?.tagName==='BUTTON'){
                event.preventDefault();
            }
        });
        this.toolbar.addEventListener('keydown',event=>{
            if(event.isComposing||event.keyCode===229||this._composing||this.dropdown.opened||!event.target.matches('[data-action]')){return;}
            let buttons = Array.from(this.toolbar.querySelectorAll('[data-action]:not(:disabled)'));
            let index = buttons.indexOf(event.target);
            if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
                event.preventDefault();
                let next = event.key==='Home'?0:event.key==='End'?buttons.length-1:
                    (index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
                buttons.forEach((button,i)=>button.tabIndex=i===next?0:-1);
                buttons[next]?.focus({preventScroll:true});
            }else if(event.key==='Escape'){
                event.preventDefault();
                this.restoreSelection();
            }
        });
        this.toolbar.addEventListener('click',event=>{
            let control = event.target.closest('button[data-action]');
            if(control&&!control.disabled){
                let feature = this.tools.get(control.dataset.action);
                if(feature?.type==='dropdown'||feature?.type==='color'){
                    this.dropdown.toggle(control);
                }else{
                    this.dropdown.close();
                    this.execute(control.dataset.action,null,event);
                }
            }
        });
        this.content.addEventListener('beforeinput',event=>{
            if(this.formControl.disabled){event.preventDefault();return;}
            if(event.isComposing||this._composing){return;}
            if(['historyUndo','historyRedo'].includes(event.inputType)){
                event.preventDefault();
                this.history.move(event.inputType==='historyUndo'?-1:1);
                return;
            }
            this.history.capture(event.inputType);
            if(this.codes?.beforeInput(event)||this.blocks.beforeInput(event)){
                if(event.defaultPrevented&&event.inputType?.startsWith('delete')){this.selection.ensureVisible();}
                return;
            }
            this.normalizeContent(true);
            document.execCommand('defaultParagraphSeparator',false,'p');
        });
        this.content.addEventListener('keydown',event=>{
            if(this.formControl.disabled||event.isComposing||event.keyCode===229||this._composing){return;}
            this.blocks.keyDown(event);
            if(event.defaultPrevented&&['Backspace','Delete'].includes(event.key)){this.selection.ensureVisible();}
        },true);
        this.content.addEventListener('input',event=>{
            if(!event.isComposing&&!this._composing&&!this._transaction){
                let unchanged = this._compositionHTML===this.content.innerHTML;
                this._compositionHTML = null;
                if(unchanged){return;}
                this.update(true,true,event.inputType);
                if(event.inputType?.startsWith('delete')){this.selection.ensureVisible();}
            }
        });
        this.content.addEventListener('compositionstart',()=>{
            this.history.record();
            this._composing = true;
        });
        this.content.addEventListener('compositionend',()=>{
            this._composing = false;
            this.update();
            this._compositionHTML = this.content.innerHTML;
        });
        ['pointerup','keyup','focus'].forEach(name=>this.content.addEventListener(name,event=>{
            if(event.isComposing||this._composing){return;}
            if(name==='pointerup'||name==='keyup'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){this.history.cutoff();}
            this.saveSelection();
            if(this.painter&&this.codes.selected()){
                this.cancelPainter();
            }
            if(this.painter&&name!=='focus'){
                let range = this.getRange();
                if(range&&!range.collapsed){
                    let styles = this.painter;
                    this.cancelPainter();
                    this.applyStyle(styles);
                }
            }
            this.scheduleToolbarUpdate();
        }));
        this.shadowRoot.addEventListener('keydown',event=>{
            if(event.isComposing||event.keyCode===229||this._composing){return;}
            if(event.altKey&&event.key==='F10'&&!this.formControl.disabled){
                event.preventDefault();
                this.saveSelection();
                this.toolbar.querySelector('[data-action]:not(:disabled)')?.focus({preventScroll:true});
                return;
            }
            if(event.key==='Escape'&&this.painter){
                this.cancelPainter();
            }
            if(this.formControl.disabled||event.target!==this.content||!(event.ctrlKey||event.metaKey)||event.altKey){
                return;
            }
            let key = event.key.toLowerCase();
            if(key==='z'||key==='y'){
                event.preventDefault();
                this.history.move(key==='y'||event.shiftKey?1:-1);
            }else if(['b','i','u'].includes(key)){
                event.preventDefault();
                this.execute({'b':'bold','i':'italic','u':'underline'}[key]);
            }
        });
        this.sourceArea.addEventListener('input',()=>{
            this.updateCount();
            this.formControl.update();
        });
    }
    execute(name,value,event){
        if(this._composing){return;}
        let feature = this.tools.get(name);
        if(this.tools.disabled(feature)){
            return;
        }
        if(feature.type==='dropdown'&&!feature.options.some(option=>String(option.value)===String(value))){
            return;
        }
        let revision = this._toolbarRevision;
        this.saveSelection();
        feature.execute(this,value,event);
        if(feature.insertion&&this._dialog){
            this._dialog.dataset.insert = feature.name;
        }
        if(this._toolbarRevision===revision){this.updateToolbar();}
    }
    openInsertDialog(type,mode){
        if(!this.isConnected||!this._initialized||this.formControl.disabled||this._composing||this.source||this.codes?.selected()){
            return null;
        }
        type = String(type??'').trim().toLowerCase();
        if(!mediaAttributes.includes(type)){return null;}
        let modes = this.config.methods(type);
        if(mode!==undefined){mode = String(mode).trim().toLowerCase();}
        if(!modes.length||mode!==undefined&&!modes.includes(mode)){return null;}
        this.saveSelection();
        let dialog = this.tools.get(type).execute(this,mode);
        if(!dialog?.isConnected){return null;}
        dialog.dataset.insertSource = 'api';
        this.updateToolbar();
        return dialog;
    }
    canInsert(name){
        return this.tools.canInsert(name);
    }
    saveSelection(){
        return this.selection.save();
    }
    restoreSelection(){
        this.codes?.normalize(this.selection.range);
        this.normalizeContent(true,this.selection.range);
        let range = this.selection.restore();
        document.execCommand('defaultParagraphSeparator',false,'p');
        return range;
    }
    normalizeContent(ensure=false,range=this.selection.current()||this.selection.range){
        let current = this.selection.current();
        if(range&&!this.content.contains(range.commonAncestorContainer)){
            range = null;
        }
        let changed = this.normalizer?this.normalizer.normalize(range,ensure):normalizeParagraphs(this.content,range,ensure);
        this.blocks.normalize();
        if(range&&changed){
            this.selection.range = range.cloneRange();
            if(current){
                this.selection.select(range);
            }
        }
    }
    getRange(){
        return this.selection.current()||this.selection.range;
    }
    selectedElement(){
        let range = this.getRange();
        let node = range?.startContainer;
        return node?(node.nodeType===1?node:node.parentElement):this.content;
    }
    selectedBlocks(){
        let range = this.getRange();
        return Array.from(this.content.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li,td,th')).filter(node=>range?.intersectsNode(node));
    }
    command(name,value=null,css=true){
        if(this.source||this.formControl.disabled){
            return;
        }
        this.transaction(()=>{
            document.execCommand('styleWithCSS',false,css);
            document.execCommand(name,false,value);
        });
    }
    query(name){
        try{
            return !!this.selection.current()&&document.queryCommandState(name);
        }catch(error){
            return false;
        }
    }
    transaction(callback){
        if(this.formControl.disabled||this._composing){return;}
        let nested = !!this._transaction;
        if(!nested){this.history.record();this.restoreSelection();}
        // 原生 input 与嵌套命令不重复提交，最外层事务统一更新。
        this._transaction = true;
        try{
            callback();
        }finally{
            this._transaction = nested;
        }
        if(!nested){
            this.saveSelection();
            this.update();
        }
    }
    insertHTML(html){
        if(this.formControl.disabled){return;}
        let safe = sanitizeHTML(html);
        if(!safe){
            return;
        }
        this.transaction(()=>document.execCommand('insertHTML',false,safe));
    }
    applyStyle(styles){
        this.transaction(()=>{
            let range = applyStyle(this.content,this.getRange(),styles);
            this.selection.select(range);
        });
    }
    setPainter(styles){
        this.painter = styles;
        this.content.classList.add('painting');
        this.updateToolbar();
    }
    cancelPainter(){
        if(!this.painter){return;}
        this.painter = null;
        this.content?.classList.remove('painting');
        if(this._initialized){
            this.updateToolbar();
        }
    }
    toggleSource(){
        if(!this.source&&(this.formControl.disabled||!this.tools.canView('source'))){return;}
        this.mobile?.close();
        this._dialog?.dismiss();
        this.dropdown.close();
        this.cancelPainter();
        if(this.source){
            let value = sanitizeHTML(this.sourceArea.value);
            this.content.innerHTML = value;
            normalizeTableCells(this.content,true);
            this.selection.range = null;
            this.source = false;
            this.content.hidden = false;
            this.sourceArea.hidden = true;
            if(!this.formControl.disabled){this.restoreSelection();}
            this.update();
        }else{
            this.saveSelection();
            this.sourceArea.value = this.value;
            this.source = true;
            this.content.hidden = true;
            this.sourceArea.hidden = false;
            this.sourceArea.focus({preventScroll:true});
        }
        this.updatePlaceholder();
        this.formControl.update();
        this.updateToolbar();
    }
    updatePlaceholder(){
        // 提示独立于编辑内容，空标题、列表等结构也应保留自己的布局。
        let text = this.content.textContent.replace(/[\s\u200b-\u200d\ufeff]/g,'');
        let structure = this.content.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,li,img,video,audio,iframe,table,blockquote,hr,pre');
        let blocks = Array.from(this.content.querySelectorAll('p,div')).filter(node=>!node.querySelector('p,div'));
        let lines = this.content.querySelectorAll('br').length;
        this.placeholder.hidden = this.source||!!text||!!structure||blocks.length>1||lines>1;
    }
    update(record=true,emit=true,inputType=''){
        if(!this.source){
            this.codes?.normalize();
            this.normalizeContent();
        }
        this.content.querySelectorAll('a[href]').forEach(link=>{
            if(!link.hasAttribute('download')){
                setLinkTarget(link);
            }
        });
        // 自动排版输出及源码，保留编辑节点和当前选区。
        let html = this.source?null:this.contentHTML();
        let value = this.formatValue(this.source?this.sourceArea.value:html);
        let text = this.getText(value);
        if(!this.source){
            this.sourceArea.value = value;
        }
        this.updatePlaceholder();
        this.updateCount(text);
        this.formControl.update(value);
        if(record){
            this.history.record(this.source?undefined:html,inputType);
        }
        this.updateToolbar();
        if(emit){
            this.dispatchEvent(new CustomEvent('change',{detail:{value,text},bubbles:true,composed:true}));
        }
    }
    scheduleToolbarUpdate(){
        if(this._toolbarFrame||!this.isConnected){return;}
        this._toolbarFrame = requestAnimationFrame(()=>{
            this._toolbarFrame = null;
            this.updateToolbar();
        });
    }
    updateToolbar(){
        if(!this.history){
            return;
        }
        cancelAnimationFrame(this._toolbarFrame);
        this._toolbarFrame = null;
        this._toolbarRevision = (this._toolbarRevision||0)+1;
        this.table?.refresh();
        this.links?.refresh();
        this.images?.refresh();
        this.codes?.refresh();
        this.tools.update();
        this.updateLocale();
        this.fullscreen?.update(!!this.fullscreen.state);
        this.mobile?.update();
        this.tooltip?.refresh();
    }
    t(key,params){
        return this.locale.text(key,params);
    }
    updateLocale(){
        let language = this.locale.name;
        if(this.panel.lang!==language){
            this.panel.lang = language;
            [this.toolbar,this.footer,this.table?.toolbar,this.links?.toolbar,this.images?.toolbar,this.codes?.toolbar,this._dialog].forEach(root=>this.locale.apply(root));
            this.locale.apply(this.content,false);
            this.locale.apply(this.sourceArea,false);
        }
        let placeholder = this.config.get('placeholder');
        if(this.placeholder.textContent!==placeholder){
            this.placeholder.textContent = placeholder;
        }
    }
    updateCount(text=this.text){
        this.locale.set(this.wordCount,'{count} 字',{count:text.replace(/\s/g,'').length});
    }
    openDialog(options){
        if(this.formControl.disabled){return;}
        return openDialog(this,options);
    }
}

if(!customElements.get('widget-editor')){
    customElements.define('widget-editor',WidgetEditor);
}
