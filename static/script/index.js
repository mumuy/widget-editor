(function(){
    let $tabs = document.querySelector('.mod-tabs');
    let $items = Array.from($tabs.querySelectorAll('.nav li'));
    let $links = $items.map($item=>$item.querySelector('a'));
    let $panels = Array.from($tabs.querySelectorAll('.panel'));

    function selectTab(index){
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

    // 演示页作为外部调用方处理文件，正式使用时替换成自己的上传服务。
    document.querySelectorAll('widget-editor').forEach(function($editor){
        $editor.addEventListener('upload',function(event){
            let {file,type,onUploadComplete,onUploadError,onProgress} = event.detail;
            let reader = new FileReader();
            reader.onprogress = function(event){
                if(event.lengthComputable){
                    onProgress(event.loaded/event.total*100);
                }
            };
            reader.onload = function(){
                let source = String(reader.result);
                if(type==='attachment'){
                    source = source.replace(/^data:[^,]*;base64,/, 'data:application/octet-stream;base64,');
                }else if(type==='audio'&&file.type==='audio/x-wav'){
                    source = source.replace(/^data:[^,]*;base64,/, 'data:audio/wav;base64,');
                }
                onUploadComplete(source);
            };
            reader.onerror = ()=>onUploadError('文件读取失败，请重试');
            reader.onabort = ()=>onUploadError('文件读取已取消');
            reader.readAsDataURL(file);
        });
    });

})();
