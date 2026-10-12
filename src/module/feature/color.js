import {color as icon,renderIcon} from '../icon.js';

export default {
    'name':'color',
    'icon':icon,
    'label':'文字颜色',
    'type':'color',
    render(){
        // 第一行使用灰阶，其余同一色系通过明暗及饱和度拉开差异。
        let colors = [
            ['#ffffff','#eeeeee','#cccccc','#aaaaaa','#888888','#666666','#555555','#333333','#222222','#000000'],
            ['#f87171','#fb923c','#fbbf24','#facc15','#4ade80','#2dd4bf','#38bdf8','#60a5fa','#a78bfa','#f472b6'],
            ['#ff0000','#ff8000','#ffbf00','#ffff00','#00b050','#00bfa5','#00b8e6','#0066ff','#8800ff','#ff0080'],
            ['#bf7373','#b88a5f','#b69b53','#a6a34f','#699970','#5f9b90','#5f91a8','#687fac','#9270a6','#b46c8e'],
            ['#aa1111','#a83f00','#a87700','#878700','#007a33','#007a66','#006a88','#1746a0','#662099','#a31859']
        ].flat();
        return `<div class="tool-dropdown" data-dropdown="color">
            <button type="button" class="tool tool-color" data-action="color" title="文字颜色" aria-label="文字颜色" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-color">${renderIcon(icon)}<span class="color-indicator" aria-hidden="true"></span></button>
            <div class="tool-menu color-menu" part="color-menu" id="menu-color" role="dialog" aria-label="文字颜色" popover="manual" hidden>
                <div class="color-caption">预设颜色</div>
                <div class="color-swatches">${colors.map(color=>`<button type="button" class="color-swatch" part="color-swatch" data-color="${color}" style="background:${color}" title="${color}" aria-label="文字颜色 ${color}" aria-pressed="false"></button>`).join('')}</div>
                <form class="color-form"><label for="color-value">自定义颜色</label><div class="color-fields"><input id="color-value" name="color" type="text" aria-label="颜色色值" placeholder="#336699" pattern="#[0-9a-fA-F]{6}" maxlength="7" required><button type="submit">确定</button></div></form>
            </div>
        </div>`;
    },
    bind(editor){
        let group = editor.toolbar.querySelector('[data-dropdown="color"]');
        let apply = value=>{
            if(editor.source){
                return;
            }
            editor.dropdown.close();
            editor.execute('color',value);
        };
        group.addEventListener('click',event=>{
            if(event.target.closest('[data-action="color"]')){
                this.update(editor,this.value(editor));
            }
            let swatch = event.target.closest('[data-color]');
            if(swatch){
                apply(swatch.dataset.color);
            }
        });
        group.querySelector('form').addEventListener('submit',event=>{
            event.preventDefault();
            if(event.target.reportValidity()){
                apply(group.querySelector('input').value);
            }
        });
    },
    update(editor,value){
        let group = editor.toolbar.querySelector('[data-dropdown="color"]');
        group.querySelector('[data-action]').style.setProperty('--selected-color',value);
        // 选色期间不改写输入框，也不恢复编辑区焦点。
        if(editor.dropdown.opened!==group){
            group.querySelector('input').value = value;
        }
        group.querySelectorAll('[data-color]').forEach(button=>{
            button.setAttribute('aria-pressed',String(button.dataset.color===value));
        });
    },
    execute(editor,value){
        if(/^#[0-9a-f]{6}$/i.test(value)){
            editor.applyStyle({'color':value});
        }
    },
    value(editor){
        let $element = editor.selectedElement();
        let value = $element ? window.getComputedStyle($element).color : '';
        let match = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if(match){
            return '#'+match.slice(1,4).map((number)=>{
                return Number(number).toString(16).padStart(2,'0');
            }).join('');
        }
        return /^#[0-9a-f]{6}$/i.test(value) ? value : '#334155';
    }
};
