import positionMenu from './method/positionMenu.js';
import {escapeHTML} from './method/sanitize.js';
import {chevron as arrow,renderIcon} from './icon.js';

// 下拉选项使用普通节点，可在组件 CSS 或 ::part 中修改样式。
export default class EditorDropdown {
    constructor(editor){
        this.editor = editor;
        this.opened = null;
        this.onOutside = event=>{
            if(this.opened&&!event.composedPath().includes(this.opened)){
                this.close();
            }
        };
        this.onScroll = event=>{
            if(this.opened&&(!(event.target instanceof Node)||!this.opened.contains(event.target))){
                this.close();
            }
        };
        this.onKey = event=>this.keydown(event);
        this.onClick = event=>{
            let option = event.target.closest('[data-option]');
            if(option&&!option.disabled){
                let name = option.closest('.tool-dropdown').dataset.dropdown;
                this.close();
                this.editor.execute(name,option.dataset.option,event);
            }
        };
    }
    static render(feature){
        let id = 'menu-'+feature.name;
        let role = feature.actionMenu?'menu':'listbox';
        return `<div class="tool-dropdown" data-dropdown="${feature.name}">
            <button type="button" class="tool tool-dropdown-button${feature.iconOnly?' icon-only':''}" part="dropdown-trigger" data-action="${feature.name}" aria-label="${feature.label}" aria-haspopup="${role}" aria-expanded="false" aria-controls="${id}">
                ${feature.icon?renderIcon(feature.icon):''}
                <span class="tool-label" ${feature.iconOnly?'hidden':''}></span>${renderIcon(arrow,true)}
            </button>
            <div class="tool-menu" part="dropdown-menu ${feature.name}-menu" id="${id}" role="${role}" aria-label="${feature.label}" popover="manual" hidden>
                ${feature.options.map(option=>`<button type="button" class="tool-option" part="dropdown-option" role="${feature.actionMenu?'menuitem':'option'}" tabindex="-1"${feature.actionMenu?'':' aria-selected="false"'} data-option="${escapeHTML(option.value)}"${option.font?' style="font-family:'+escapeHTML(option.font)+'"':''}>${option.icon?renderIcon(option.icon):''}<span>${escapeHTML(option.label)}</span></button>`).join('')}
            </div>
        </div>`;
    }
    connect(){
        document.addEventListener('pointerdown',this.onOutside);
        window.addEventListener('resize',this.onScroll);
        window.addEventListener('scroll',this.onScroll,true);
        this.editor.toolbar.addEventListener('keydown',this.onKey);
        this.editor.toolbar.addEventListener('click',this.onClick);
    }
    disconnect(){
        this.close();
        document.removeEventListener('pointerdown',this.onOutside);
        window.removeEventListener('resize',this.onScroll);
        window.removeEventListener('scroll',this.onScroll,true);
        this.editor.toolbar.removeEventListener('keydown',this.onKey);
        this.editor.toolbar.removeEventListener('click',this.onClick);
    }
    toggle(button){
        let group = button.closest('.tool-dropdown');
        if(this.opened===group){
            this.close();
            return;
        }
        this.close();
        this.editor.saveSelection();
        this.opened = group;
        let menu = group.querySelector('.tool-menu');
        menu.hidden = false;
        menu.showPopover();
        button.setAttribute('aria-expanded','true');
        positionMenu(menu,button);
        let selected = menu.querySelector('[aria-selected="true"]:not(:disabled),[aria-pressed="true"]:not(:disabled)')||menu.querySelector('button:not(:disabled)');
        if(selected){
            selected.focus({preventScroll:true});
            this.scrollOption(selected);
        }
    }
    close(focus=false){
        if(!this.opened){
            return;
        }
        let group = this.opened;
        let menu = group.querySelector('.tool-menu');
        if(menu.matches(':popover-open')){
            menu.hidePopover();
        }
        menu.hidden = true;
        let button = group.querySelector('[data-action]');
        button.setAttribute('aria-expanded','false');
        this.opened = null;
        if(focus){
            button.focus({preventScroll:true});
        }
    }
    update(feature,value){
        let group = this.editor.toolbar.querySelector('[data-dropdown="'+feature.name+'"]');
        let button = group.querySelector('[data-action]');
        let current = feature.actionMenu?null:value||feature.options[0].value;
        let option = feature.options.find(option=>option.value===current);
        button.value = current||'';
        this.editor.locale.set(button.querySelector('.tool-label'),feature.actionMenu?feature.label:option?option.label:feature.display?.(current)||feature.label);
        let icon = feature.icon&&(option?.icon||feature.icon);
        if(icon&&button._icon!==icon){
            button.querySelector('.tool-icon').outerHTML = renderIcon(icon);
            button._icon = icon;
        }
        if(feature.iconOnly){
            this.editor.locale.set(button,option?.label||feature.label,{},'aria-label');
        }
        group.querySelectorAll('[data-option]').forEach(item=>{
            let selected = item.dataset.option===current;
            if(!feature.actionMenu){
                item.setAttribute('aria-selected',String(selected));
            }
            item.disabled = !!feature.disabled?.(this.editor,item.dataset.option);
            item.setAttribute('part','dropdown-option'+(selected?' dropdown-option-selected':''));
        });
    }
    scrollOption(option){
        let menu = option.closest('.tool-menu');
        let top = option.offsetTop;
        let bottom = top+option.offsetHeight;
        if(top<menu.scrollTop){
            menu.scrollTop = top;
        }else if(bottom>menu.scrollTop+menu.clientHeight){
            menu.scrollTop = bottom-menu.clientHeight;
        }
    }
    keydown(event){
        if(event.isComposing||event.keyCode===229||this.editor._composing){return;}
        let button = event.target.closest('.tool-dropdown-button');
        if(button&&['ArrowDown','ArrowUp'].includes(event.key)&&!button.disabled){
            event.preventDefault();
            if(!this.opened){
                this.toggle(button);
            }
            return;
        }
        if(!this.opened){
            return;
        }
        if(this.opened.querySelector('.tool-menu').getAttribute('role')==='dialog'){
            if(event.key==='Escape'){
                event.preventDefault();
                event.stopPropagation();
                this.close(true);
            }
            return;
        }
        if(event.key==='Escape'||event.key==='Tab'){
            this.close(true);
            if(event.key==='Escape'){
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }
        if(event.key==='Enter'||event.key===' '){
            let option = event.target.closest('[data-option]');
            if(option){
                event.preventDefault();
                option.click();
            }
            return;
        }
        let options = Array.from(this.opened.querySelectorAll('[data-option]:not(:disabled)'));
        if(!options.length){
            return;
        }
        let index = options.indexOf(this.editor.shadowRoot.activeElement);
        let next;
        if(event.key==='ArrowDown'){
            next = (index+1)%options.length;
        }else if(event.key==='ArrowUp'){
            next = (index-1+options.length)%options.length;
        }else if(event.key==='Home'){
            next = 0;
        }else if(event.key==='End'){
            next = options.length-1;
        }
        if(next!==undefined){
            event.preventDefault();
            options[next].focus({preventScroll:true});
            this.scrollOption(options[next]);
        }
    }
}
