import features from './module/feature/index.js';
import {insertFeatures} from './module/feature/insert.js';
import EditorSelection from './module/method/selection.js';
import sanitizeHTML,{escapeHTML} from './module/method/sanitize.js';
import formatHTML from './module/method/formatHTML.js';
import applyStyle from './module/method/applyStyle.js';
import normalizeParagraphs from './module/method/normalizeParagraphs.js';
import normalizeTableCells from './module/method/normalizeTableCells.js';
import EditorHistory from './module/history.js';
import openDialog from './module/dialog.js';
import EditorDropdown from './module/dropdown.js';
import EditorTooltip from './module/tooltip.js';
import EditorFullscreen from './module/fullscreen.js';
import EditorLanguage from './module/language/index.js';
import {renderIcon,undo as undoIcon,redo as redoIcon,fullscreen as fullscreenIcon,source as sourceIcon} from './module/icon.js';
import styleSheet from './style/default.css' with { type: 'css'};

class WidgetEditor extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode:'open'});
        this.locale = new EditorLanguage(this);
        this.source = false;
        this.painter = null;
        this._initialized = false;
        this._pendingValue = null;
        this._onSelection = ()=>{
            if(this.selection?.current()){
                this.saveSelection();
                this.updateToolbar();
            }else{
                this.links?.refresh();
                this.codes?.refresh();
            }
        };
    }
    static get observedAttributes(){
        return ['placeholder','height','insert','custom','language'];
    }
    connectedCallback(){
        if(!this._initialized){
            this.render();
            this.addStyle();
            this._initialized = true;
            this.selection = new EditorSelection(this);
            this.history = new EditorHistory(this);
            this.dropdown = new EditorDropdown(this);
            this.value = this._pendingValue===null?this.innerHTML:this._pendingValue;
            this.bindEvents();
            this.tooltip = new EditorTooltip(this);
            this.fullscreen = new EditorFullscreen(this);
            this.attributeChangedCallback();
            this.dispatchEvent(new CustomEvent('ready',{bubbles:true,composed:true}));
        }
        this.dropdown.connect();
        this.table?.connect();
        this.links.connect();
        this.codes.connect();
        this.tooltip.connect();
        this.fullscreen.connect();
        document.addEventListener('selectionchange',this._onSelection);
    }
    disconnectedCallback(){
        this.fullscreen?.disconnect();
        this.dropdown?.disconnect();
        this.table?.disconnect();
        this.links?.disconnect();
        this.codes?.disconnect();
        this.tooltip?.disconnect();
        document.removeEventListener('selectionchange',this._onSelection);
        this._dialog?.dismiss();
    }
    attributeChangedCallback(name){
        if(!this.content){
            return;
        }
        if(name==='language'){
            this.updateLocale();
            this.links?.refresh();
            this.tooltip?.refresh();
            return;
        }
        if((name==='insert'||name==='custom')&&this.dropdown){
            this.saveSelection();
            this.dropdown.close();
            this.tooltip?.hide();
            this.toolbar.innerHTML = this.toolbarHTML();
            this.toolbarFeatures.forEach(feature=>feature.bindToolbar?.(this));
            this.locale.apply(this.toolbar);
            if(this._dialog?.dataset.insert&&!this.canInsert(this._dialog.dataset.insert)){
                this._dialog.dismiss();
            }
            this.updateToolbar();
        }
        this.updatePlaceholder();
        let height = Number(this.getAttribute('height'));
        this.style.setProperty('--editor-height',(height>=160&&height<=2000?height:420)+'px');
        this.updateLocale();
    }
    get value(){
        if(!this._initialized){
            return this._pendingValue===null?this.innerHTML:this._pendingValue;
        }
        return formatHTML(this.source?this.sourceArea.value:this.contentHTML());
    }
    set value(value){
        if(!this._initialized){
            this._pendingValue = String(value||'');
            return;
        }
        this._dialog?.dismiss();
        this.content.innerHTML = sanitizeHTML(value);
        normalizeTableCells(this.content,true);
        this.sourceArea.value = formatHTML(this.content.innerHTML);
        this.selection.range = null;
        this.normalizeContent(false,null);
        this.cancelPainter();
        this.history.reset();
        this.update(false,false);
    }
    get text(){
        let template = document.createElement('template');
        template.innerHTML = this.value;
        return (template.content.textContent||'').replace(/\u200b/g,'');
    }
    getHTML(){
        return this.value;
    }
    contentHTML(){
        if(!this.content.querySelector('[data-table-selected],[data-code-placeholder],[data-code-boundary]')){
            return this.content.innerHTML;
        }
        let content = this.content.cloneNode(true);
        content.querySelectorAll('[data-table-selected]').forEach(cell=>cell.removeAttribute('data-table-selected'));
        content.querySelectorAll('pre code br[data-code-placeholder]').forEach(node=>node.remove());
        content.querySelectorAll('[data-code-boundary]').forEach(node=>{
            if(this.codes.empty(node)&&node.previousElementSibling?.tagName==='PRE'&&!node.nextElementSibling){
                node.remove();
            }else{
                node.removeAttribute('data-code-boundary');
            }
        });
        return content.innerHTML;
    }
    setHTML(value){
        this.value = value;
    }
    addStyle(){
        this.shadowRoot.querySelector('style[data-widget-editor]')?.remove();
        if(this.shadowRoot.adoptedStyleSheets){
            this.shadowRoot.adoptedStyleSheets = [styleSheet];
        }else{
            const $style = document.createElement('style');
            $style.dataset.widgetEditor = '1';
            $style.textContent = [...styleSheet.cssRules].map(item=>item.cssText).join('');
            this.shadowRoot.appendChild($style);
        }
    }
    toolbarHTML(){
        let controls = [{name:'undo',label:'撤销',icon:undoIcon,execute:editor=>editor.history.move(-1)},
            {name:'redo',label:'重做',icon:redoIcon,execute:editor=>editor.history.move(1)},
            ...features,
            {name:'fullscreen',label:'全屏',icon:fullscreenIcon,type:'button',
                execute:editor=>editor.fullscreen.state?editor.fullscreen.close():editor.fullscreen.open(),
                active:editor=>!!editor.fullscreen?.state}];
        this.features = controls.map(feature=>typeof feature.options==='function'?{...feature,options:feature.options(this)}:feature);
        let available = new Map([...this.features,...insertFeatures].map(feature=>[feature.name.toLowerCase(),feature]));
        let names = Array.from(new Set((this.getAttribute('custom')||'').split(',').map(name=>name.trim().toLowerCase())));
        this.toolbarFeatures = this.hasAttribute('custom')?
            [...this.features.slice(0,2),...names.map(name=>available.get(name)).filter(feature=>feature&&!['undo','redo'].includes(feature.name))]:
            this.features.filter(feature=>!['source','fullscreen'].includes(feature.name));
        return this.toolbarFeatures.map(function(feature){
            let attributes = `data-action="${feature.name}" aria-label="${feature.label}"`;
            if(feature.type==='dropdown'){
                return feature.options.length?EditorDropdown.render(feature):'';
            }
            if(feature.type==='color'){
                return feature.render();
            }
            return `<button type="button" class="tool tool-button" ${attributes}>${renderIcon(feature.icon)}</button>`;
        }).join('');
    }
    render(){
        let toolbar = this.toolbarHTML();
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
                <button type="button" class="tool tool-button fullscreen-button" data-action="fullscreen" aria-label="全屏" aria-pressed="false">${renderIcon(fullscreenIcon)}</button>
                <button type="button" class="tool tool-button source-button" data-action="source" aria-label="源代码" aria-pressed="false">${renderIcon(sourceIcon)}</button>
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
        this.features.forEach(feature=>{
            feature.bind?.(this);
            feature.bindToolbar?.(this);
        });
        this.toolbar.addEventListener('pointerdown',event=>{
            let control = event.target.closest('[data-action]');
            this.saveSelection();
            if(control?.tagName==='BUTTON'){
                event.preventDefault();
            }
        });
        this.toolbar.addEventListener('click',event=>{
            let control = event.target.closest('button[data-action]');
            if(control&&!control.disabled){
                let feature = this.features.find(feature=>feature.name===control.dataset.action)||this.toolbarFeatures.find(feature=>feature.name===control.dataset.action);
                if(feature.type==='dropdown'||feature.type==='color'){
                    this.dropdown.toggle(control);
                }else{
                    this.dropdown.close();
                    this.execute(control.dataset.action,null,event);
                }
            }
        });
        this.content.addEventListener('beforeinput',event=>{
            if(this.codes?.beforeInput(event)){return;}
            this.normalizeContent(true);
            document.execCommand('defaultParagraphSeparator',false,'p');
        });
        this.content.addEventListener('input',event=>{
            if(!event.isComposing&&!this._transaction){
                this.update();
            }
        });
        this.content.addEventListener('compositionend',()=>this.update());
        ['pointerup','keyup','focus'].forEach(name=>this.content.addEventListener(name,()=>{
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
            this.updateToolbar();
        }));
        this.content.addEventListener('paste',event=>{
            event.preventDefault();
            this.saveSelection();
            let html = event.clipboardData.getData('text/html');
            let text = event.clipboardData.getData('text/plain');
            let lines = text.split(/\r\n?|\n/);
            this.insertHTML(html||(lines.length>1?lines.map(line=>'<p>'+(escapeHTML(line)||'<br>')+'</p>').join(''):escapeHTML(text)));
        });
        this.content.addEventListener('drop',event=>event.preventDefault());
        this.shadowRoot.addEventListener('keydown',event=>{
            if(event.key==='Escape'&&this.painter){
                this.cancelPainter();
            }
            if(event.target!==this.content||!(event.ctrlKey||event.metaKey)||event.altKey){
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
        });
    }
    execute(name,value,event){
        let insertion = insertFeatures.find(feature=>feature.name===name);
        let feature = this.features.find(feature=>feature.name===name)||insertion;
        if(!feature||this.source&&!['source','fullscreen'].includes(name)||insertion&&!this.canInsert(name)){
            return;
        }
        if(this.codes.selected()&&!['undo','redo','source','fullscreen','format'].includes(name)){
            return;
        }
        this.saveSelection();
        feature.execute(this,value,event);
        if(insertion&&this._dialog){
            this._dialog.dataset.insert = name;
        }
        this.updateToolbar();
    }
    canInsert(name){
        return this.toolbarFeatures.some(feature=>feature.name===name)||this.features.find(feature=>feature.name==='insert').options.some(option=>option.value===name);
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
        let changed = normalizeParagraphs(this.content,range,ensure);
        if(range&&changed){
            this.selection.range = range.cloneRange();
            if(current){
                let selection = this.shadowRoot.getSelection?.()||window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
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
        if(this.source){
            return;
        }
        this.restoreSelection();
        document.execCommand('styleWithCSS',false,css);
        document.execCommand(name,false,value);
        this.saveSelection();
        this.update();
    }
    query(name){
        try{
            return !!this.selection.current()&&document.queryCommandState(name);
        }catch(error){
            return false;
        }
    }
    transaction(callback){
        this.restoreSelection();
        // 原生命令可能触发 input，事务结束时统一保存和更新。
        this._transaction = true;
        try{
            callback();
        }finally{
            this._transaction = false;
        }
        this.saveSelection();
        this.update();
    }
    insertHTML(html){
        let safe = sanitizeHTML(html);
        if(!safe){
            return;
        }
        this.restoreSelection();
        document.execCommand('insertHTML',false,safe);
        this.saveSelection();
        this.update();
    }
    applyStyle(styles){
        this.transaction(()=>{
            let range = applyStyle(this.content,this.getRange(),styles);
            let selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            this.selection.range = range.cloneRange();
        });
    }
    setPainter(styles){
        this.painter = styles;
        this.content.classList.add('painting');
        this.updateToolbar();
    }
    cancelPainter(){
        this.painter = null;
        this.content?.classList.remove('painting');
        if(this._initialized){
            this.updateToolbar();
        }
    }
    toggleSource(){
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
            this.restoreSelection();
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
        this.updateToolbar();
    }
    updatePlaceholder(){
        // 提示独立于编辑内容，空标题、列表等结构也应保留自己的布局。
        let text = this.content.textContent.replace(/[\s\u200b-\u200d\ufeff]/g,'');
        let structure = this.content.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,li,img,video,audio,table,blockquote,hr,pre');
        let blocks = Array.from(this.content.querySelectorAll('p,div')).filter(node=>!node.querySelector('p,div'));
        let lines = this.content.querySelectorAll('br').length;
        this.placeholder.hidden = this.source||!!text||!!structure||blocks.length>1||lines>1;
    }
    update(record=true,emit=true){
        if(!this.source){
            this.codes?.normalize();
            this.normalizeContent();
        }
        this.content.querySelectorAll('a[href]').forEach(link=>{
            if(!link.hasAttribute('download')){
                link.setAttribute('target','_blank');
                link.setAttribute('rel','noopener noreferrer');
            }
        });
        // 自动排版输出及源码，保留编辑节点和当前选区。
        let value = this.value;
        let text = this.text;
        if(!this.source){
            this.sourceArea.value = value;
        }
        this.updatePlaceholder();
        this.updateCount(text);
        if(record){
            this.history.record();
        }
        this.updateToolbar();
        if(emit){
            this.dispatchEvent(new CustomEvent('change',{detail:{value,text},bubbles:true,composed:true}));
        }
    }
    updateToolbar(){
        if(!this.history){
            return;
        }
        this.table?.refresh();
        this.links?.refresh();
        this.codes?.refresh();
        let inCode = !!this.codes?.selected();
        let features = new Map([...this.features,...this.toolbarFeatures].map(feature=>[feature.name,feature]));
        features.forEach(feature=>{
            let controls = this.panel.querySelectorAll('[data-action="'+feature.name+'"]');
            controls.forEach(control=>{
                control.disabled = this.source&&!['source','fullscreen'].includes(feature.name)||inCode&&!['undo','redo','source','fullscreen','format'].includes(feature.name)||feature.name==='undo'&&!this.history.canUndo||feature.name==='redo'&&!this.history.canRedo;
                if(feature.type==='dropdown'){
                    this.dropdown.update(feature,feature.value?.(this));
                }else if(feature.type==='color'){
                    feature.update(this,feature.value(this));
                }else if(feature.active){
                    let active = feature.active(this);
                    control.classList.toggle('active',active);
                    control.setAttribute('aria-pressed',String(active));
                }
            });
        });
        this.updateLocale();
        this.fullscreen?.update(!!this.fullscreen.state);
        this.tooltip?.refresh();
    }
    t(key,params){
        return this.locale.text(key,params);
    }
    updateLocale(){
        let language = this.locale.name;
        if(this.panel.lang!==language){
            this.panel.lang = language;
            [this.toolbar,this.footer,this.table?.toolbar,this.links?.toolbar,this.codes?.toolbar,this._dialog].forEach(root=>this.locale.apply(root));
            this.locale.apply(this.content,false);
            this.locale.apply(this.sourceArea,false);
        }
        let placeholder = this.getAttribute('placeholder')||this.t('在这里开始写作…');
        if(this.placeholder.textContent!==placeholder){
            this.placeholder.textContent = placeholder;
        }
    }
    updateCount(text=this.text){
        this.locale.set(this.wordCount,'{count} 字',{count:text.replace(/\s/g,'').length});
    }
    openDialog(options){
        return openDialog(this,options);
    }
}

if(!customElements.get('widget-editor')){
    customElements.define('widget-editor',WidgetEditor);
}
