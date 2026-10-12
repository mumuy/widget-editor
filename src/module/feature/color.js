import {color as icon,renderIcon} from '../icon.js';

export default {
    'name':'color',
    'icon':icon,
    'label':'文字颜色',
    'type':'color',
    render(){
        // 灰阶等间隔，同列保持色相，按行降低亮度，后两行保持高饱和度。
        let colors = [
            ['#ffffff','#e3e3e3','#c6c6c6','#aaaaaa','#8e8e8e','#717171','#555555','#393939','#1c1c1c','#000000'],
            ['#ff4d4d','#ffa64d','#ffd24d','#ffff4d','#4dff88','#4dffe1','#4dd2ff','#4d88ff','#b54dff','#ff4da6'],
            ['#db1f1f','#db7d1f','#dbac1f','#dbdb1f','#1fdb5e','#1fdbbc','#1facdb','#1f5edb','#8d1fdb','#db1f7d'],
            ['#b80000','#b85c00','#b88a00','#b8b800','#00b83d','#00b899','#008ab8','#003db8','#6b00b8','#b8005c'],
            ['#940000','#944a00','#946f00','#949400','#009431','#00947b','#006f94','#003194','#560094','#94004a']
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
