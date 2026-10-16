import {emoji as icon,renderIcon} from '../icon.js';

const labels = new Map([
    ['😀','开心'],['😃','大笑'],['😄','笑脸'],['😁','咧嘴笑'],['😊','微笑'],['😂','笑哭'],['🤣','哈哈大笑'],['🥰','喜欢'],
    ['😍','心动'],['😘','飞吻'],['😋','美味'],['😎','酷'],['🤩','惊喜'],['🥳','庆祝'],['🤗','拥抱'],['🤔','思考'],
    ['🙃','倒脸'],['😉','眨眼'],['😅','尴尬'],['😌','放松'],['😴','睡觉'],['😭','大哭'],['🥺','委屈'],['😤','生气'],
    ['😮','惊讶'],['😱','震惊'],['🤯','震撼'],['🤭','偷笑'],['🤫','安静'],['😷','口罩'],['🤒','发烧'],['🤧','感冒'],
    ['👍','赞'],['👎','踩'],['👏','鼓掌'],['🙏','感谢'],['💪','加油'],['👌','好的'],['✌️','胜利'],['🤝','握手'],
    ['❤️','爱心'],['💔','心碎'],['💕','两颗心'],['💯','满分'],['🔥','火热'],['🎉','礼花'],['🎁','礼物'],['🌹','玫瑰'],
    ['☀️','太阳'],['🌈','彩虹'],['⭐','星星'],['🌙','月亮'],['🍀','幸运'],['☕','咖啡'],['🎂','蛋糕'],['🚀','火箭']
]);

const categoryIcons = [
    '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 9h.01M16 9h.01"/>',
    '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    '<ellipse cx="5" cy="9" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="16" cy="5" rx="2" ry="3"/><ellipse cx="21" cy="9" rx="2" ry="3"/><path d="M7 17c0-3 3-6 6-6s6 3 6 6c0 4-4 2-6 2s-6 2-6-2Z"/>',
    '<path d="M4 8h12v6a6 6 0 0 1-12 0ZM16 9h2a3 3 0 0 1 0 6h-2M7 2v3M11 2v3M3 22h15"/>',
    '<path d="m5 8 2-5h10l2 5M3 8h18v9H3ZM5 17v3M19 17v3M6 12h2M16 12h2"/>',
    '<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6ZM12 3v4M3.5 9.5 7 11M20.5 9.5 17 11M6.5 19 9 17M17.5 19 15 17"/>',
    '<path d="M8 14a6 6 0 1 1 8 0l-1 3H9ZM9 20h6M10 23h4"/>',
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'
].map(content=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`);

const groups = [
    ['笑脸情绪','😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮 😯 😲 😳 🥺 😢 😭 😤 😠 😡 🤯 😱 😨 😰 😥 😓 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥱 😴 🤤 😪 😎 🤓 🧐 🤩 🥳 😷 🤒 🤕 🤢 🤮 🤧 😵 🤠 😇 😈 👿 👻 💀 🤖 👽 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'],
    ['人物手势','👋 🤚 🖐️ ✋ 🖖 👌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💪 🦾 🦵 🦶 👂 👃 👀 👁️ 🧠 🦷 👶 🧒 🧑 👩 👨 🧓 👵 👴 🧑‍💻 🧑‍🎨 🧑‍🍳 🧑‍🔬 🧑‍🚀 👮 🧑‍🚒 🧑‍🏫 🧑‍⚕️'],
    ['动物自然','🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦗 🕷️ 🐢 🐍 🦎 🐙 🦑 🦐 🦀 🐠 🐟 🐡 🐬 🐳 🦈 🐊 🐘 🦒 🦓 🦌 🐪 🦙 🦘 🦥 🦦 🦔 🐾 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🌺 🌸 🌼 🌻 ☀️ 🌤️ ☁️ 🌧️ ⛈️ 🌨️ ❄️ ⛄ 🌈 🌙 ⭐ 🌟 ✨ 🔥 💧 🌊'],
    ['食物饮品','🍎 🍏 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🥔 🍠 🥐 🥯 🍞 🥖 🧀 🥚 🍳 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍙 🍚 🍘 🍢 🍡 🍤 🍿 🍦 🍨 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🍵 🧃 🥤 🧋 🍺 🍻 🥂 🍷 🍹 🍸 🥃 🍽️ 🥢'],
    ['旅行地点','🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚚 🚛 🚜 🛵 🏍️ 🚲 🛴 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🚁 🚀 🛸 ⛵ 🚤 🛳️ ⚓ ⛽ 🚦 🚧 🗺️ 🧭 🏠 🏡 🏢 🏫 🏥 🏦 🏨 🏪 🏛️ 🏰 🗼 🗽 ⛩️ 🏖️ 🏝️ 🏜️ 🏕️ ⛰️ 🏔️ 🌋 🌅 🌄 🌃 🌆 🌇 🌉 🎡 🎢 🎠'],
    ['活动庆祝','⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥅 ⛳ 🏹 🎣 🥊 🥋 🛹 ⛸️ 🎿 🛷 🏋️ 🤸 🏊 🚴 🏃 🧘 💃 🕺 🎯 🎮 🕹️ 🎲 🧩 ♟️ 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 🏆 🥇 🥈 🥉 🏅 🎖️ 🎉 🎊 🎈 🎁 🎀 🎇 🎆'],
    ['生活物品','📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💾 💿 📷 📸 📹 🎥 📺 📻 ☎️ 🔋 🔌 💡 🔦 🕯️ ⏰ ⌚ ⏳ ⌛ 📚 📖 📕 📗 📘 📙 📓 📔 📒 📝 ✏️ 🖊️ 🖋️ 🖌️ 📌 📍 📎 🖇️ 📐 📏 ✂️ 📁 📂 🗂️ 📅 📆 📋 📊 📈 📉 🔍 🔎 🔒 🔓 🔑 🗝️ 🔨 🪛 🔧 🛠️ ⚙️ 🧰 🧲 ⚖️ 💰 💵 💳 💎 🛒 👕 👖 👗 👟 👠 🎒 👜 👓 🕶️ ☂️ 🧴 🧼 🧹 🧺 🛏️ 🛋️ 🪑 🚪 🪴'],
    ['符号爱心','❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💋 💯 💢 💥 💫 💦 💤 ✅ ☑️ ✔️ ❌ ❎ ➕ ➖ ✖️ ➗ ❗ ❓ ❕ ❔ ‼️ ⁉️ ⚠️ 🚫 ⛔ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 ⬛ ⬜ ◼️ ◻️ ▶️ ⏸️ ⏹️ ⏭️ ⏮️ 🔁 🔂 🔀 ⬆️ ⬇️ ⬅️ ➡️ ↗️ ↘️ ↙️ ↖️ ↔️ ↕️ ♻️ ⚜️ 🔱 ©️ ®️ ™️ #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟']
].map(([name,values],index)=>({name,icon:categoryIcons[index],emojis:values.split(' ')}));

export default {
    'name':'emoji',
    'label':'插入表情',
    'icon':icon,
    'type':'button',
    execute(editor){
        let selected = groups[0].emojis[0];
        editor.openDialog({
            'title':'插入表情',
            'submitLabel':'插入表情',
            mount(dialog){
                dialog.classList.add('emoji-dialog');
                let picker = document.createElement('div');
                picker.className = 'emoji-picker';
                picker.innerHTML = '<div class="emoji-tabs" role="tablist" aria-label="表情分类"></div><div class="emoji-panel" id="emoji-panel" role="tabpanel"><div class="emoji-grid" role="group"></div></div>';
                let tabs = picker.querySelector('.emoji-tabs');
                let panel = picker.querySelector('.emoji-panel');
                let grid = picker.querySelector('.emoji-grid');
                let update = ()=>{
                    let current = Array.from(grid.children).findIndex(button=>button.textContent===selected);
                    Array.from(grid.children).forEach((button,index)=>{
                        button.setAttribute('aria-pressed',String(index===current));
                        button.tabIndex = index===Math.max(0,current)?0:-1;
                    });
                };
                let select = button=>{
                    selected = button.textContent;
                    update();
                };
                let show = index=>{
                    let group = groups[index];
                    Array.from(tabs.children).forEach((button,current)=>{
                        button.setAttribute('aria-selected',String(current===index));
                        button.tabIndex = current===index?0:-1;
                    });
                    panel.setAttribute('aria-labelledby','emoji-tab-'+index);
                    editor.locale.set(grid,group.name,{},'aria-label');
                    grid.replaceChildren(...group.emojis.map(value=>{
                        let button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'emoji-button';
                        button.textContent = value;
                        let label = labels.get(value)||'{category}：{emoji}';
                        let params = {category:group.name,emoji:value};
                        editor.locale.set(button,label,params,'title');
                        editor.locale.set(button,label,params,'aria-label');
                        return button;
                    }));
                    panel.scrollTop = 0;
                    update();
                };
                groups.forEach((group,index)=>{
                    let button = document.createElement('button');
                    button.type = 'button';
                    button.id = 'emoji-tab-'+index;
                    button.setAttribute('role','tab');
                    button.setAttribute('aria-controls','emoji-panel');
                    button.innerHTML = renderIcon(group.icon);
                    editor.locale.set(button,group.name,{},'aria-label');
                    editor.locale.set(button,group.name,{},'title');
                    button.addEventListener('click',()=>show(index));
                    button.addEventListener('keydown',event=>{
                        let offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1};
                        let next = event.key==='Home'?0:event.key==='End'?groups.length-1:
                            offsets[event.key]?(index+offsets[event.key]+groups.length)%groups.length:null;
                        if(next!==null){
                            event.preventDefault();
                            show(next);
                            tabs.children[next].focus();
                        }
                    });
                    tabs.appendChild(button);
                });
                grid.addEventListener('click',event=>{
                    let button = event.target.closest('.emoji-button');
                    if(button){select(button);}
                });
                grid.addEventListener('keydown',event=>{
                    let button = event.target.closest('.emoji-button');
                    if(!button){return;}
                    let index = Array.from(grid.children).indexOf(button);
                    let offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
                    let next = event.key==='Home'?0:event.key==='End'?grid.children.length-1:
                        offsets[event.key]?Math.max(0,Math.min(grid.children.length-1,index+offsets[event.key])):null;
                    if(next!==null){
                        event.preventDefault();
                        select(grid.children[next]);
                        grid.children[next].focus();
                    }
                });
                show(0);
                dialog.querySelector('.dialog-body').prepend(picker);
            },
            onSubmit(){
                editor.command('insertText',selected);
                return true;
            }
        });
    }
};
