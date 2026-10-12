/*
 * 演示页面：示例切换、主题设置与 HTML 导出
 */
(function(){
    const editor = document.getElementById('editor');
    const tabs = Array.from(document.querySelectorAll('[data-example]'));
    const panel = document.getElementById('editor-panel');
    const status = document.getElementById('demo-status');
    const themeButton = document.getElementById('theme-toggle');
    const examples = {
        article: '<h1>让文字，成为更好的表达</h1>'+
            '<p style="color:#8b98a6;">一篇小小的文章，从一个想法开始。</p>'+
            '<p>你好，欢迎使用 <strong>Widget Editor</strong>。这是一个轻量的富文本编辑器。你可以直接修改这段文字，也可以从空白文档开始书写。</p>'+
            '<h2>写作，也可以很简单</h2>'+
            '<p>选中文字，试试工具栏中的 <strong>加粗</strong>、<em>斜体</em>和<span style="color:#2095f2;">文字颜色</span>。用标题梳理文章，用列表记录灵感，让每一个想法都清楚可见。</p>'+
            '<ul><li>用 H1 至 H6 标题，建立内容层次</li><li>插入链接和本地图片，让信息更完整</li><li>使用格式刷，让段落风格保持一致</li></ul>'+
            '<h3>从一张清单出发</h3>'+
            '<ol><li>写下今天想分享的事情</li><li>为重要的信息设置样式</li><li>导出 HTML，保存你的作品</li></ol>'+
            '<p>了解更多：<a href="https://github.com/mumuy/widget-editor" target="_blank" rel="noopener noreferrer">查看项目源码</a>。</p>',
        announcement: '<h2 style="text-align:center;">周末读书会 · 活动公告</h2>'+
            '<p style="text-align:center;color:#8b98a6;">把好书带来，把想法留下。</p>'+
            '<p>本周我们将一起分享最近读过的一本书。欢迎带上你的笔记，聊聊书中的故事，以及让你印象深刻的一句话。</p>'+
            '<h3>活动安排</h3>'+
            '<table><thead><tr><th>时间</th><th>环节</th><th>内容</th></tr></thead><tbody><tr><td>14:00</td><td>自由交流</td><td>介绍你带来的书</td></tr><tr><td>14:30</td><td>主题分享</td><td>聊聊你的阅读收获</td></tr><tr><td>15:30</td><td>交流讨论</td><td>推荐下一本书</td></tr></tbody></table>'+
            '<h3>准备事项</h3>'+
            '<ul><li>带一本想分享的书</li><li>准备一段喜欢的摘录</li><li>带着好奇心，认识新的朋友</li></ul>'+
            '<p><strong style="color:#2095f2;">期待与你见面！</strong></p>',
        blank: ''
    };
    let currentExample = 'article';
    let changeTimer;

    function showStatus(message){
        status.replaceChildren();
        const dot = document.createElement('span');
        dot.className = 'status-dot';
        dot.setAttribute('aria-hidden','true');
        status.append(dot,document.createTextNode(message));
    }

    function selectExample(name){
        currentExample = name;
        tabs.forEach(function(tab){
            const isActive = tab.dataset.example===name;
            tab.classList.toggle('active',isActive);
            tab.setAttribute('aria-selected',String(isActive));
            tab.tabIndex = isActive?0:-1;
            if(isActive){
                panel.setAttribute('aria-labelledby',tab.id);
            }
        });
        editor.value = examples[name];
        showStatus(name==='blank'?'空白文档已准备好，开始写作吧。':'示例已加载，可直接编辑内容。');
    }

    tabs.forEach(function(tab,index){
        tab.addEventListener('click',function(){
            selectExample(tab.dataset.example);
        });
        tab.addEventListener('keydown',function(event){
            let nextIndex;
            if(event.key==='ArrowRight'){
                nextIndex = (index+1)%tabs.length;
            }else if(event.key==='ArrowLeft'){
                nextIndex = (index-1+tabs.length)%tabs.length;
            }else if(event.key==='Home'){
                nextIndex = 0;
            }else if(event.key==='End'){
                nextIndex = tabs.length-1;
            }
            if(nextIndex!==undefined){
                event.preventDefault();
                tabs[nextIndex].focus();
                selectExample(tabs[nextIndex].dataset.example);
            }
        });
    });

    themeButton.addEventListener('click',function(){
        const isDark = editor.getAttribute('theme')!=='dark';
        editor.setAttribute('theme',isDark?'dark':'light');
        themeButton.setAttribute('aria-pressed',String(isDark));
        themeButton.lastElementChild.textContent = isDark?'浅色模式':'深色模式';
    });

    document.getElementById('reset-demo').addEventListener('click',function(){
        selectExample(currentExample);
        showStatus('已重置为当前示例内容。');
    });

    document.getElementById('export-html').addEventListener('click',function(){
        const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n'+
            '    <head>\n        <meta charset="utf-8"/>\n'+
            '        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n'+
            '        <title>我的文档</title>\n'+
            '        <style>body{max-width:900px;margin:40px auto;padding:0 24px;font:16px/1.8 sans-serif;color:#334155;}img{max-width:100%;height:auto;}table{border-collapse:collapse;width:100%;}td,th{padding:8px 12px;border:1px solid #dbe2ea;}a{color:#2095f2;}pre{white-space:pre-wrap;}</style>\n'+
            '    </head>\n    <body>\n'+editor.value+'\n    </body>\n</html>\n';
        const blob = new Blob([html],{type:'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'widget-editor-document.html';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function(){
            URL.revokeObjectURL(url);
        },1000);
        showStatus('HTML 文档已导出，图片与样式将一起保留。');
    });

    editor.addEventListener('change',function(){
        window.clearTimeout(changeTimer);
        changeTimer = window.setTimeout(function(){
            showStatus('内容已更新，可随时导出 HTML。');
        },350);
    });

    customElements.whenDefined('widget-editor').then(function(){
        selectExample(currentExample);
    });
})();
