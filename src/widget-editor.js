import features from './module/feature/index.js';
import EditorSelection from './module/method/selection.js';
import sanitizeHTML,{escapeHTML} from './module/method/sanitize.js';
import formatHTML from './module/method/formatHTML.js';
import EditorHistory from './module/history.js';
import openDialog from './module/dialog.js';
import EditorDropdown from './module/dropdown.js';
import {renderIcon,undo as undoIcon,redo as redoIcon} from './module/icon.js';
import styleSheet from './style/default.css' with { type: 'css'};

class WidgetEditor extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode:'open'});
        this.source = false;
        this.painter = null;
        this._initialized = false;
        this._pendingValue = null;
        this._onSelection = ()=>{
            if(this.selection?.current()){
                this.saveSelection();
                this.updateToolbar();
            }
        };
    }
    static get observedAttributes(){
        return ['placeholder','height'];
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
            this.attributeChangedCallback();
            this.dispatchEvent(new CustomEvent('ready',{bubbles:true,composed:true}));
        }
        this.dropdown.connect();
        document.addEventListener('selectionchange',this._onSelection);
    }
    disconnectedCallback(){
        this.dropdown?.disconnect();
        document.removeEventListener('selectionchange',this._onSelection);
        this._dialog?.remove();
        this._dialog = null;
    }
    attributeChangedCallback(){
        if(!this.content){
            return;
        }
        this.placeholder.textContent = this.getAttribute('placeholder')||'在这里开始写作…';
        this.updatePlaceholder();
        let height = Number(this.getAttribute('height'));
        this.style.setProperty('--editor-height',(height>=160&&height<=2000?height:420)+'px');
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
        this.content.innerHTML = sanitizeHTML(value);
        this.sourceArea.value = formatHTML(this.content.innerHTML);
        this.selection.range = null;
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
        if(!this.content.querySelector('[data-table-selected]')){
            return this.content.innerHTML;
        }
        let content = this.content.cloneNode(true);
        content.querySelectorAll('[data-table-selected]').forEach(cell=>cell.removeAttribute('data-table-selected'));
        return content.innerHTML;
    }
    setHTML(value){
        this.value = value;
    }
    addStyle(){
        // 移除旧的 style 节点，避免重复渲染时样式叠加
        let oldStyle = this.shadowRoot.querySelector('style[data-widget-editor]');
        if(oldStyle){
            oldStyle.remove();
        }
        if(this.shadowRoot.adoptedStyleSheets){
            this.shadowRoot.adoptedStyleSheets = [styleSheet];
        }else{
            const $style = document.createElement('style');
            $style.rel = 'defaultSheet';
            $style.dataset.widgetEditor = '1';   // 标记以便重复渲染时清理
            $style.textContent = [...styleSheet.cssRules].map(item=>item.cssText).join('');
            this.shadowRoot.appendChild($style);
        }
    }
    render(){
        let controls = [{name:'undo',label:'撤销',icon:undoIcon,execute:editor=>editor.history.move(-1)},
            {name:'redo',label:'重做',icon:redoIcon,execute:editor=>editor.history.move(1)},...features];
        this.features = controls;
        let toolbar = controls.map(function(feature){
            let attributes = `data-action="${feature.name}" title="${feature.label}" aria-label="${feature.label}"`;
            if(feature.type==='dropdown'){
                return EditorDropdown.render(feature);
            }
            if(feature.type==='color'){
                return feature.render();
            }
            return `<button type="button" class="tool tool-button" ${attributes}>${renderIcon(feature.icon)}</button>`;
        }).join('');
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
                <span class="mode-label">可视化编辑</span>
                <span class="notice" role="status" aria-live="polite"></span>
                <span class="word-count">0 字</span>
            </div>
        </div>`;
        this.content = this.shadowRoot.querySelector('.editor-content');
        this.placeholder = this.shadowRoot.querySelector('.editor-placeholder');
        this.sourceArea = this.shadowRoot.querySelector('.editor-source');
        this.toolbar = this.shadowRoot.querySelector('.toolbar');
    }
    bindEvents(){
        this.features.forEach(feature=>feature.bind?.(this));
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
                let feature = this.features.find(feature=>feature.name===control.dataset.action);
                if(feature.type==='dropdown'||feature.type==='color'){
                    this.dropdown.toggle(control);
                }else{
                    this.dropdown.close();
                    this.execute(control.dataset.action,null,event);
                }
            }
        });
        this.content.addEventListener('input',()=>this.update());
        ['pointerup','keyup','focus'].forEach(name=>this.content.addEventListener(name,()=>{
            this.saveSelection();
            if(this.painter&&name!=='focus'){
                let range = this.getRange();
                if(range&&!range.collapsed){
                    let styles = this.painter;
                    this.cancelPainter();
                    this.applyStyle(styles);
                    this.notify('已应用格式');
                }
            }
            this.updateToolbar();
        }));
        this.content.addEventListener('paste',event=>{
            event.preventDefault();
            this.saveSelection();
            let html = event.clipboardData.getData('text/html');
            let text = event.clipboardData.getData('text/plain');
            this.insertHTML(html||escapeHTML(text).replace(/\r?\n/g,'<br>'));
        });
        this.content.addEventListener('drop',event=>{
            event.preventDefault();
            this.notify('请通过工具栏上传图片或粘贴文字');
        });
        this.shadowRoot.addEventListener('keydown',event=>{
            if(event.key==='Escape'&&this.painter){
                this.cancelPainter();
                this.notify('已取消格式刷');
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
            this.shadowRoot.querySelector('.word-count').textContent = this.text.replace(/\s/g,'').length+' 字';
        });
    }
    execute(name,value,event){
        let feature = this.features.find(feature=>feature.name===name);
        if(!feature||this.source&&name!=='source'){
            return;
        }
        this.saveSelection();
        feature.execute(this,value,event);
        this.updateToolbar();
    }
    saveSelection(){
        return this.selection.save();
    }
    restoreSelection(){
        return this.selection.restore();
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
    command(name,value=null){
        if(this.source){
            return;
        }
        this.restoreSelection();
        document.execCommand('styleWithCSS',false,true);
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
        callback();
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
            let range = this.getRange();
            let apply = element=>Object.keys(styles).forEach(name=>element.style.setProperty(name,styles[name]));
            if(range.collapsed){
                let span = document.createElement('span');
                span.textContent = '\u200b';
                apply(span);
                range.insertNode(span);
                range.setStart(span.firstChild,1);
                range.collapse(true);
            }else{
                // 分别包裹文本节点，保留原有标题、列表、链接及跨段结构。
                let walker = document.createTreeWalker(this.content,NodeFilter.SHOW_TEXT);
                let nodes = [];
                while(walker.nextNode()){
                    let node = walker.currentNode;
                    if(range.intersectsNode(node)){
                        let start = node===range.startContainer?range.startOffset:0;
                        let end = node===range.endContainer?range.endOffset:node.length;
                        if(end>start){
                            nodes.push({node,start,end});
                        }
                    }
                }
                let spans = nodes.map(function(item){
                    let node = item.node;
                    if(item.end<node.length){
                        node.splitText(item.end);
                    }
                    if(item.start>0){
                        node = node.splitText(item.start);
                    }
                    let span = document.createElement('span');
                    apply(span);
                    node.replaceWith(span);
                    span.appendChild(node);
                    return span;
                });
                if(spans.length){
                    range.setStart(spans[0].firstChild,0);
                    let last = spans[spans.length-1].firstChild;
                    range.setEnd(last,last.length);
                }
            }
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
        this.dropdown.close();
        this.cancelPainter();
        if(this.source){
            let value = sanitizeHTML(this.sourceArea.value);
            this.content.innerHTML = value;
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
        this.shadowRoot.querySelector('.mode-label').textContent = this.source?'HTML 源代码':'可视化编辑';
        this.updatePlaceholder();
        this.updateToolbar();
    }
    updatePlaceholder(){
        // 提示独立于编辑内容，空标题、列表等结构也应保留自己的布局。
        let text = this.content.textContent.replace(/[\s\u200b-\u200d\ufeff]/g,'');
        let structure = this.content.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,li,img,table,blockquote');
        let blocks = Array.from(this.content.querySelectorAll('p,div')).filter(node=>!node.querySelector('p,div'));
        let lines = this.content.querySelectorAll('br').length;
        this.placeholder.hidden = this.source||!!text||!!structure||blocks.length>1||lines>1;
    }
    update(record=true,emit=true){
        this.content.querySelectorAll('a[href]').forEach(link=>{
            link.setAttribute('target','_blank');
            link.setAttribute('rel','noopener noreferrer');
        });
        // 自动排版输出及源码，保留编辑节点和当前选区。
        let value = this.value;
        let text = this.text;
        if(!this.source){
            this.sourceArea.value = value;
        }
        this.updatePlaceholder();
        this.shadowRoot.querySelector('.word-count').textContent = text.replace(/\s/g,'').length+' 字';
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
        this.features.forEach(feature=>{
            let control = this.toolbar.querySelector('[data-action="'+feature.name+'"]');
            control.disabled = this.source&&feature.name!=='source'||feature.name==='undo'&&!this.history.canUndo||feature.name==='redo'&&!this.history.canRedo;
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
    }
    notify(message){
        this.shadowRoot.querySelector('.notice').textContent = message;
        let notice = this._dialog?.querySelector('.dialog-notice');
        if(notice){
            notice.textContent = message;
        }
    }
    openDialog(options){
        return openDialog(this,options);
    }
}

if(!customElements.get('widget-editor')){
    customElements.define('widget-editor',WidgetEditor);
}
