import {renderIcon} from './icon.js';
import {readColor} from './method/color.js';

const grayscale = ['#ffffff','#e3e3e3','#c6c6c6','#aaaaaa','#8e8e8e','#717171','#555555','#393939','#1c1c1c','#000000'];
const hues = ['#e34b4b','#df8b32','#c9a82c','#b6b62c','#36b35f','#28afa0','#349ec9','#527edb','#a15bd5','#d94f93'];

function tint(color,amount){
    return '#'+color.match(/[\da-f]{2}/g).map(value=>{
        let channel = parseInt(value,16);
        return Math.round(channel+(255-channel)*amount).toString(16).padStart(2,'0');
    }).join('');
}

// 两种颜色功能共用面板与选区处理；背景使用同列色相的浅色。
export default function colorFeature(name,label,property,icon){
    let background = property==='background-color';
    let levels = background?[.86,.72,.56,.4]:[.6,.38,.18,0];
    let colors = grayscale.map(color=>background?tint(color,.72):color)
        .concat(levels.flatMap(level=>hues.map(color=>tint(color,level))));
    return {
        name,icon,label,type:'color',
        render(){
            return `<div class="tool-dropdown" data-dropdown="${name}">
                <button type="button" class="tool tool-color" data-action="${name}" aria-label="${label}" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu-${name}">${renderIcon(icon)}<span class="color-indicator" aria-hidden="true"></span></button>
                <div class="tool-menu color-menu" part="color-menu${background?' '+name+'-menu':''}" id="menu-${name}" role="dialog" aria-label="${label}" popover="manual" hidden>
                    ${background?'<button type="button" class="color-clear" data-color="transparent" aria-pressed="false">无背景色</button>':''}
                    <div class="color-caption">预设颜色</div>
                    <div class="color-swatches">${colors.map(color=>`<button type="button" class="color-swatch" part="color-swatch" data-color="${color}" style="background:${color}" title="${color}" aria-label="${label} ${color}" aria-pressed="false"></button>`).join('')}</div>
                    <div class="color-form">
                        <label for="${name}-value">自定义颜色</label>
                        <div class="color-fields">
                            <input id="${name}-value" name="color" type="text" aria-label="颜色色值" placeholder="#336699" pattern="#[0-9a-fA-F]{6}" maxlength="7" required>
                            <button type="submit">确定</button>
                        </div>
                    </div>
                </div>
            </div>`;
        },
        bindToolbar(editor){
            let group = editor.toolbar.querySelector('[data-dropdown="'+name+'"]');
            if(!group){return;}
            group.querySelectorAll('.color-swatch').forEach(button=>{
                editor.locale.set(button,label+' {color}',{color:button.dataset.color},'aria-label');
            });
            let apply = value=>{
                editor.dropdown.close();
                editor.execute(name,value);
            };
            group.addEventListener('click',event=>{
                if(event.target.closest('[data-action]')){this.update(editor,this.value(editor));}
                let swatch = event.target.closest('[data-color]');
                if(swatch){apply(swatch.dataset.color);}
            });
            // 用 DOM 创建表单，避免编辑器位于外层 form 时被 HTML 解析器忽略。
            let container = group.querySelector('.color-form');
            let form = document.createElement('form');
            form.className = container.className;
            form.append(...container.childNodes);
            container.replaceWith(form);
            form.addEventListener('submit',event=>{
                event.preventDefault();
                if(form.reportValidity()){apply(group.querySelector('input').value);}
            });
        },
        update(editor,value){
            let group = editor.toolbar.querySelector('[data-dropdown="'+name+'"]');
            group.querySelector('[data-action]').style.setProperty('--selected-color',value);
            // 选色期间不改写输入框，也不恢复编辑区焦点。
            if(editor.dropdown.opened!==group){
                group.querySelector('input').value = value==='transparent'?'':value;
            }
            group.querySelectorAll('[data-color]').forEach(button=>{
                button.setAttribute('aria-pressed',String(button.dataset.color===value));
            });
        },
        execute(editor,value){
            editor.command(name,value);
        },
        value(editor){
            return readColor(editor,property);
        }
    };
}
