(function(){
    const mascot = document.querySelector('.mascot');
    if(!mascot){return;}
    const wag = mascot.querySelector('#mascot-wag');
    const nod = mascot.querySelector('#mascot-nod');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let running = false;
    let bounds;
    let pointer;
    let frame;
    let timer;
    let gaze = '';

    function resetGaze(){
        cancelAnimationFrame(frame);
        frame = null;
        gaze = '';
        mascot.style.removeProperty('--gaze-x');
        mascot.style.removeProperty('--gaze-y');
        if(!mascot.style.length){mascot.removeAttribute('style');}
    }
    function updateGaze(){
        frame = null;
        bounds ||= mascot.getBoundingClientRect();
        const dx = pointer.x-bounds.left-bounds.width*.374;
        const dy = pointer.y-bounds.top-bounds.height*.48;
        const x = (14*dx/(Math.abs(dx)+180)).toFixed(1);
        const y = (10*dy/(Math.abs(dy)+140)).toFixed(1);
        const next = x+','+y;
        if(next===gaze){return;}
        gaze = next;
        mascot.style.setProperty('--gaze-x',x+'px');
        mascot.style.setProperty('--gaze-y',y+'px');
    }
    function track(event){
        if(event.pointerType!=='mouse'&&event.pointerType!=='pen'){return;}
        pointer = {x:event.clientX,y:event.clientY};
        if(!frame){frame = requestAnimationFrame(updateGaze);}
    }
    function invalidate(){
        bounds = null;
    }
    function idle(){
        timer = setTimeout(()=>{
            const action = Math.random();
            if(action<.25){
                nod.beginElement();
            }else{
                mascot.classList.add(action<.75?'blinking':'panting');
            }
            idle();
        },3500+Math.random()*5000);
    }
    function sync(){
        const active = visible&&!document.hidden&&!reduced.matches;
        if(active===running){return;}
        running = active;
        if(active){
            wag.beginElement();
            bounds = null;
            document.addEventListener('pointermove',track,{passive:true});
            document.addEventListener('pointerleave',resetGaze);
            window.addEventListener('scroll',invalidate,{passive:true});
            window.addEventListener('resize',invalidate,{passive:true});
            idle();
        }else{
            document.removeEventListener('pointermove',track);
            document.removeEventListener('pointerleave',resetGaze);
            window.removeEventListener('scroll',invalidate);
            window.removeEventListener('resize',invalidate);
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            frame = null;
            wag.endElement();
            nod.endElement();
            mascot.classList.remove('blinking','panting');
            resetGaze();
        }
    }
    mascot.addEventListener('animationend',event=>{
        if(event.animationName==='mascot-blink'){mascot.classList.remove('blinking');}
        if(event.animationName==='mascot-tongue'){mascot.classList.remove('panting');}
    });
    new IntersectionObserver(entries=>{
        visible = entries[0].isIntersecting;
        sync();
    }).observe(mascot);
    document.addEventListener('visibilitychange',sync);
    reduced.addEventListener('change',sync);
})();
