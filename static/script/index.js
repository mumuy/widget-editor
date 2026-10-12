(function(){
    let $tabs = document.querySelector('.mod-tabs');
    let $items = Array.from($tabs.querySelectorAll('.nav li'));
    let $links = $items.map($item=>$item.querySelector('a'));
    let $panels = Array.from($tabs.querySelectorAll('.panel'));
    let $editors = $panels.map($panel=>$panel.querySelector('widget-editor'));
    let $theme = document.getElementById('theme-toggle');
    let _index = 0;
    let _examples = [];

    function selectTab(index){
        _index = index;
        $items.forEach(function($item,i){
            let active = i===index;
            $item.classList.toggle('active',active);
            $links[i].setAttribute('aria-selected',String(active));
            $links[i].tabIndex = active?0:-1;
            $panels[i].hidden = !active;
        });
    }

    $links.forEach(function($link,index){
        $link.addEventListener('click',function(event){
            event.preventDefault();
            selectTab(index);
        });
        $link.addEventListener('keydown',function(event){
            let next;
            if(event.key==='ArrowRight'){
                next = (index+1)%$links.length;
            }else if(event.key==='ArrowLeft'){
                next = (index-1+$links.length)%$links.length;
            }else if(event.key==='Home'){
                next = 0;
            }else if(event.key==='End'){
                next = $links.length-1;
            }else if(event.key===' '){
                next = index;
            }
            if(next!==undefined){
                event.preventDefault();
                selectTab(next);
                $links[next].focus();
            }
        });
    });

    document.querySelector('.gotop').addEventListener('click',function(event){
        event.preventDefault();
        window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });

    customElements.whenDefined('widget-editor').then(function(){
        _examples = $editors.map($editor=>$editor.value);
        $theme.addEventListener('click',function(){
            let dark = $theme.getAttribute('aria-pressed')!=='true';
            $editors.forEach(function($editor){
                $editor.setAttribute('theme',dark?'dark':'light');
            });
            $theme.setAttribute('aria-pressed',String(dark));
            $theme.textContent = dark?'浅色模式':'深色模式';
        });
        document.getElementById('reset-demo').addEventListener('click',function(){
            let $editor = $editors[_index];
            if($editor.source){
                $editor.toggleSource();
            }
            $editor.value = _examples[_index];
            $editor.notify('已重置为当前示例内容');
        });
        document.getElementById('export-html').addEventListener('click',function(){
            let $editor = $editors[_index];
            let html = '<!DOCTYPE html>\n<html lang="zh-CN">\n'+
                '    <head>\n        <meta charset="utf-8"/>\n'+
                '        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n'+
                '        <title>我的文档</title>\n'+
                '        <style>body{max-width:900px;margin:40px auto;padding:0 24px;font:16px/1.8 sans-serif;color:#333;}img{max-width:100%;height:auto;}table{border-collapse:collapse;width:100%;}td,th{padding:8px 12px;border:1px solid #ddd;}a{color:#2095f2;}pre{white-space:pre-wrap;}</style>\n'+
                '    </head>\n    <body>\n'+$editor.value+'\n    </body>\n</html>\n';
            let blob = new Blob([html],{type:'text/html;charset=utf-8'});
            let url = URL.createObjectURL(blob);
            let $link = document.createElement('a');
            $link.href = url;
            $link.download = 'widget-editor-document.html';
            document.body.appendChild($link);
            $link.click();
            $link.remove();
            window.setTimeout(function(){
                URL.revokeObjectURL(url);
            },1000);
            $editor.notify('HTML 文档已导出');
        });
    });
})();
