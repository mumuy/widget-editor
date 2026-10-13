import {emoji as icon} from '../icon.js';

const labels = new Map([
    ['😀','开心'],['😃','大笑'],['😄','笑脸'],['😁','咧嘴笑'],['😊','微笑'],['😂','笑哭'],['🤣','哈哈大笑'],['🥰','喜欢'],
    ['😍','心动'],['😘','飞吻'],['😋','美味'],['😎','酷'],['🤩','惊喜'],['🥳','庆祝'],['🤗','拥抱'],['🤔','思考'],
    ['🙃','倒脸'],['😉','眨眼'],['😅','尴尬'],['😌','放松'],['😴','睡觉'],['😭','大哭'],['🥺','委屈'],['😤','生气'],
    ['😮','惊讶'],['😱','震惊'],['🤯','震撼'],['🤭','偷笑'],['🤫','安静'],['😷','口罩'],['🤒','发烧'],['🤧','感冒'],
    ['👍','赞'],['👎','踩'],['👏','鼓掌'],['🙏','感谢'],['💪','加油'],['👌','好的'],['✌️','胜利'],['🤝','握手'],
    ['❤️','爱心'],['💔','心碎'],['💕','两颗心'],['💯','满分'],['🔥','火热'],['🎉','礼花'],['🎁','礼物'],['🌹','玫瑰'],
    ['☀️','太阳'],['🌈','彩虹'],['⭐','星星'],['🌙','月亮'],['🍀','幸运'],['☕','咖啡'],['🎂','蛋糕'],['🚀','火箭']
]);

const groups = [
    ['笑脸情绪','😀 😃 😄 😁 😆 😅 😂 🤣 😊 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😮 😯 😲 😳 🥺 😢 😭 😤 😠 😡 🤯 😱 😨 😰 😥 😓 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥱 😴 🤤 😪 😎 🤓 🧐 🤩 🥳 😷 🤒 🤕 🤢 🤮 🤧 😵 🤠 😇 😈 👿 👻 💀 🤖 👽 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'],
    ['人物手势','👋 🤚 🖐️ ✋ 🖖 👌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💪 🦾 🦵 🦶 👂 👃 👀 👁️ 🧠 🦷 👶 🧒 🧑 👩 👨 🧓 👵 👴 🧑‍💻 🧑‍🎨 🧑‍🍳 🧑‍🔬 🧑‍🚀 👮 🧑‍🚒 🧑‍🏫 🧑‍⚕️'],
    ['动物自然','🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦗 🕷️ 🐢 🐍 🦎 🐙 🦑 🦐 🦀 🐠 🐟 🐡 🐬 🐳 🦈 🐊 🐘 🦒 🦓 🦌 🐪 🦙 🦘 🦥 🦦 🦔 🐾 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🌺 🌸 🌼 🌻 ☀️ 🌤️ ☁️ 🌧️ ⛈️ 🌨️ ❄️ ⛄ 🌈 🌙 ⭐ 🌟 ✨ 🔥 💧 🌊'],
    ['食物饮品','🍎 🍏 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🥔 🍠 🥐 🥯 🍞 🥖 🧀 🥚 🍳 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍙 🍚 🍘 🍢 🍡 🍤 🍿 🍦 🍨 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🍵 🧃 🥤 🧋 🍺 🍻 🥂 🍷 🍹 🍸 🥃 🍽️ 🥢'],
    ['旅行地点','🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚚 🚛 🚜 🛵 🏍️ 🚲 🛴 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🚁 🚀 🛸 ⛵ 🚤 🛳️ ⚓ ⛽ 🚦 🚧 🗺️ 🧭 🏠 🏡 🏢 🏫 🏥 🏦 🏨 🏪 🏛️ 🏰 🗼 🗽 ⛩️ 🏖️ 🏝️ 🏜️ 🏕️ ⛰️ 🏔️ 🌋 🌅 🌄 🌃 🌆 🌇 🌉 🎡 🎢 🎠'],
    ['活动庆祝','⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥅 ⛳ 🏹 🎣 🥊 🥋 🛹 ⛸️ 🎿 🛷 🏋️ 🤸 🏊 🚴 🏃 🧘 💃 🕺 🎯 🎮 🕹️ 🎲 🧩 ♟️ 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 🏆 🥇 🥈 🥉 🏅 🎖️ 🎉 🎊 🎈 🎁 🎀 🎇 🎆'],
    ['生活物品','📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💾 💿 📷 📸 📹 🎥 📺 📻 ☎️ 🔋 🔌 💡 🔦 🕯️ ⏰ ⌚ ⏳ ⌛ 📚 📖 📕 📗 📘 📙 📓 📔 📒 📝 ✏️ 🖊️ 🖋️ 🖌️ 📌 📍 📎 🖇️ 📐 📏 ✂️ 📁 📂 🗂️ 📅 📆 📋 📊 📈 📉 🔍 🔎 🔒 🔓 🔑 🗝️ 🔨 🪛 🔧 🛠️ ⚙️ 🧰 🧲 ⚖️ 💰 💵 💳 💎 🛒 👕 👖 👗 👟 👠 🎒 👜 👓 🕶️ ☂️ 🧴 🧼 🧹 🧺 🛏️ 🛋️ 🪑 🚪 🪴'],
    ['符号爱心','❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💌 💋 💯 💢 💥 💫 💦 💤 ✅ ☑️ ✔️ ❌ ❎ ➕ ➖ ✖️ ➗ ❗ ❓ ❕ ❔ ‼️ ⁉️ ⚠️ 🚫 ⛔ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 ⬛ ⬜ ◼️ ◻️ ▶️ ⏸️ ⏹️ ⏭️ ⏮️ 🔁 🔂 🔀 ⬆️ ⬇️ ⬅️ ➡️ ↗️ ↘️ ↙️ ↖️ ↔️ ↕️ ♻️ ⚜️ 🔱 ©️ ®️ ™️ #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟']
].map(([name,values])=>({name,emojis:values.split(' ')}));

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
                picker.innerHTML = '<div class="emoji-tabs" role="tablist" aria-label="表情分类"></div><div class="emoji-panel" id="emoji-panel" role="tabpanel"><div class="emoji-grid" role="group"></div></div><div class="emoji-preview"><span>已选表情</span><span class="emoji-selected" aria-live="polite"></span></div>';
                let tabs = picker.querySelector('.emoji-tabs');
                let panel = picker.querySelector('.emoji-panel');
                let grid = picker.querySelector('.emoji-grid');
                let preview = picker.querySelector('.emoji-selected');
                let update = ()=>{
                    let current = Array.from(grid.children).findIndex(button=>button.dataset.emoji===selected);
                    Array.from(grid.children).forEach((button,index)=>{
                        button.setAttribute('aria-pressed',String(index===current));
                        button.tabIndex = index===Math.max(0,current)?0:-1;
                    });
                    preview.textContent = selected;
                };
                let select = button=>{
                    selected = button.dataset.emoji;
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
                        button.dataset.emoji = value;
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
                    editor.locale.set(button,group.name);
                    button.addEventListener('click',()=>show(index));
                    button.addEventListener('keydown',event=>{
                        let offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4};
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
                    let button = event.target.closest('[data-emoji]');
                    if(button){select(button);}
                });
                grid.addEventListener('keydown',event=>{
                    let button = event.target.closest('[data-emoji]');
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
                editor.insertHTML(selected);
                return true;
            }
        });
    }
};
