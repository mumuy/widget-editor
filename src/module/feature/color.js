import {color as icon,renderIcon} from '../icon.js';

export default {
    'name':'color',
    'icon':icon,
    'label':'文字颜色',
    'type':'color',
    render(){
        // 每列保持同一色系，从浅色到深色排列。
        let colors = [
            ['#ffffff','#f8fafc','#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#343b48','#1e293b','#000000'],
            ['#fef2f2','#fff7ed','#fffbeb','#fefce8','#f0fdf4','#f0fdfa','#f0f9ff','#eff6ff','#f5f3ff','#fdf2f8'],
            ['#fecaca','#fed7aa','#fde68a','#fef08a','#bbf7d0','#99f6e4','#bae6fd','#bfdbfe','#ddd6fe','#fbcfe8'],
            ['#f87171','#fb923c','#fbbf24','#facc15','#4ade80','#2dd4bf','#38bdf8','#60a5fa','#a78bfa','#f472b6'],
            ['#dc2626','#ea580c','#d97706','#ca8a04','#16a34a','#0d9488','#0284c7','#2563eb','#7c3aed','#db2777'],
            ['#991b1b','#9a3412','#92400e','#854d0e','#166534','#115e59','#075985','#1e40af','#5b21b6','#9d174d'],
            ['#450a0a','#431407','#451a03','#422006','#052e16','#042f2e','#082f49','#172554','#2e1065','#500724']
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
