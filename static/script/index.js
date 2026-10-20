(function(){
    const editor = document.querySelector('#product-editor');
    const resources = new Map();
    const messages = {
        'zh-CN':['文件读取失败，请重试','文件读取已取消'],
        'zh-HK':['未能讀取檔案，請重試','已取消讀取檔案'],
        'en-US':['Could not read the file. Please try again.','File reading was canceled.']
    }[document.documentElement.lang]||['文件读取失败，请重试','文件读取已取消'];

    // 锚点由浏览器平滑滚动，模块高亮只在可见状态变化时更新。
    const nav = document.querySelector('header nav');
    const links = Array.from(nav.querySelectorAll('a'));
    const visible = new Set();
    let active;
    function updateNavigation(id){
        if(active===id){return;}
        active = id;
        links.forEach(link=>{
            if(link.hash==='#'+id){link.setAttribute('aria-current','location');}
            else{link.removeAttribute('aria-current');}
        });
    }
    const navigationObserver = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){visible.add(entry.target.id);}
            else{visible.delete(entry.target.id);}
        });
        const link = links.find(link=>visible.has(link.hash.slice(1)));
        if(link){updateNavigation(link.hash.slice(1));}
    },{rootMargin:'-20% 0px -50% 0px'});
    links.forEach(link=>navigationObserver.observe(document.querySelector(link.hash)));
    document.addEventListener('click',event=>{
        const link = event.target.closest('a[href^="#"]');
        if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey){return;}
        const target = link.hash&&document.querySelector(link.hash);
        if(link.hash&&!target){return;}
        event.preventDefault();
        // 先结束上一次滚动，连续点击导航时以最后一次选择为准。
        window.scrollTo({top:window.scrollY,behavior:'instant'});
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
        if(target){target.scrollIntoView({behavior,block:'start'});}
        else{window.scrollTo({top:0,behavior});}
        if(location.hash!==link.hash){history.pushState(null,'',link.getAttribute('href'));}
        if(links.includes(link)){updateNavigation(link.hash.slice(1));}
    });
    updateNavigation(links.some(link=>link.hash===location.hash)?location.hash.slice(1):'experience');

    // 优先使用 CSS 滚动动画；未支持的浏览器只切换状态，由 CSS 完成渐变。
    if(!CSS.supports('animation-timeline','scroll()')){
        const header = document.querySelector('header');
        const updateHeader = ()=>header.classList.toggle('scrolled',window.scrollY>0);
        window.addEventListener('scroll',updateHeader,{passive:true});
        updateHeader();
    }

    // 演示文件仅在当前页面读取；正式接入时由业务服务返回资源 URL。
    async function upload(event){
        const {files,type,onComplete,onError,onProgress} = event.detail;
        try{
            const urls = [];
            for(const file of files){
                const url = await new Promise((resolve,reject)=>{
                    const reader = new FileReader();
                    reader.onload = ()=>{
                        let value = String(reader.result);
                        if(type==='attachment'){
                            value = value.replace(/^data:[^,]*;base64,/,'data:application/octet-stream;base64,');
                        }else if(type==='audio'&&file.type==='audio/x-wav'){
                            value = value.replace(/^data:[^,]*;base64,/,'data:audio/wav;base64,');
                        }
                        resolve(value);
                    };
                    reader.onerror = ()=>reject(new Error(messages[0]));
                    reader.onabort = ()=>reject(new Error(messages[1]));
                    reader.readAsDataURL(file);
                });
                urls.push(url);
                onProgress(urls.length/files.length*100);
            }
            resources.set(type,[...new Set([...urls,...resources.get(type)||[]])]);
            onComplete(urls);
        }catch(error){
            onError(error);
        }
    }
    editor.addEventListener('upload',upload);
    editor.addEventListener('add',upload);
    editor.addEventListener('request',function(event){
        const {type,page,onComplete} = event.detail;
        const items = resources.get(type)||[];
        const start = (page-1)*12;
        onComplete(items.slice(start,start+12),start+12<items.length);
    });
    editor.addEventListener('remove',function(event){
        const {type,url,onComplete} = event.detail;
        resources.set(type,(resources.get(type)||[]).filter(item=>item!==url));
        onComplete();
    });
})();
