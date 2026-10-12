import {color as icon,renderIcon} from '../icon.js';

export default {
    'name':'color',
    'icon':icon,
    'label':'文字颜色',
    'type':'color',
    render(){
        // 第一行使用灰阶，其余每列保持同一色系，只保留中间色调。
        let colors = [
            ['#ffffff','#eeeeee','#cccccc','#aaaaaa','#888888','#666666','#555555','#333333','#222222','#000000'],
            ['#f87171','#fb923c','#fbbf24','#facc15','#4ade80','#2dd4bf','#38bdf8','#60a5fa','#a78bfa','#f472b6'],
            ['#ef4444','#f97316','#f59e0b','#eab308','#22c55e','#14b8a6','#0ea5e9','#3b82f6','#8b5cf6','#ec4899'],
            ['#dc2626','#ea580c','#d97706','#ca8a04','#16a34a','#0d9488','#0284c7','#2563eb','#7c3aed','#db2777'],
            ['#b91c1c','#c2410c','#b45309','#a16207','#15803d','#0f766e','#0369a1','#1d4ed8','#6d28d9','#be185d']
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
