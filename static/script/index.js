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

})();
