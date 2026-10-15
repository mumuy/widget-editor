import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { browser } from './browser.mjs';
const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', req.url === '/build.js' ? 'text/javascript' : 'text/html');
    res.end(req.url === '/build.js' ? await readFile(new URL('../dist/widget-editor.min.js', import.meta.url)) : req.url === '/' ? '<!doctype html><meta charset="utf-8"><form><widget-editor name="content" image-limit=""></widget-editor></form><script src="/build.js"></script>' : '');
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let b;
try {
    b = await browser('http://127.0.0.1:' + server.address().port);
    const run = b.evaluate;
    const waitFor = async (expression,message)=>{
        for(let attempt=0;attempt<50;attempt++){
            if(await run(expression)){return;}
            await b.delay(100);
        }
        assert.fail(message);
    };
    await run(`window.e=document.querySelector('widget-editor');window.caret=(selector='p',end=true)=>{let r=document.createRange();r.selectNodeContents(e.content.querySelector(selector));r.collapse(!end);e.blocks.select(r);e.content.focus();};window.reset=(html='<p>Start</p>')=>{e._dialog?.dismiss();e.images.dismiss();e.value=html;caret();};window.key=(key,code)=>e.content.dispatchEvent(new KeyboardEvent('keydown',{key,code,bubbles:true}));reset();`);
    for (const text of ['a', 'b', 'c']) await b.send('Input.insertText', {
        text
    });
    assert.equal(await run(`return e.history.entries.length;`), 2, 'continuous typing one entry');
    await run('e.history.move(-1);');
    assert.equal(await run('return e.text;'), 'Start', 'undo whole typing');
    await run('e.history.move(1);');
    assert.equal(await run('return e.text;'), 'Startabc', 'redo whole typing');
    await b.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8
    });
    await b.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8
    });
    await b.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8
    });
    await b.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8
    });
    assert.equal(await run('return e.text;'), 'Starta');
    await run('e.history.move(-1);');
    assert.equal(await run('return e.text;'), 'Startabc', 'deletion separate from typing');
    await run(`reset();`);
    await b.send('Input.insertText', {
        text: 'A'
    });
    await run(`e.history.group.time-=1100;`);
    await b.send('Input.insertText', {
        text: 'B'
    });
    await run('e.history.move(-1);');
    assert.equal(await run('return e.text;'), 'StartA', 'pause breaks history group');
    await run(`reset();`);
    await b.send('Input.insertText', {
        text: 'A'
    });
    await run(`e.execute('bold');`);
    await b.send('Input.insertText', {
        text: 'B'
    });
    await run('e.history.move(-1);');
    assert.equal(await run('return e.text;'), 'StartA', 'format boundary');
    await run(`reset();`);
    await b.send('Input.insertText', {
        text: 'Undo'
    });
    await run(`e.content.dispatchEvent(new InputEvent('beforeinput',{inputType:'historyUndo',bubbles:true,cancelable:true}));`);
    assert.equal(await run('return e.text;'), 'Start', 'native undo input');
    await run(`e.content.dispatchEvent(new InputEvent('beforeinput',{inputType:'historyRedo',bubbles:true,cancelable:true}));`);
    assert.equal(await run('return e.text;'), 'StartUndo', 'native redo input');
    await run(`reset();for(let i=0;i<120;i++){e.history.record('<p>State '+i+'</p>');}if(e.history.entries.length!==100)throw Error('History count limit');for(let i=0;i<12;i++){e.history.record('x'.repeat(1024*1024)+i);}if(e.history.entries.reduce((bytes,item)=>bytes+item.value.length*2,0)>8*1024*1024)throw Error('History memory limit');reset();`);
    console.log('PASS grouped native typing/deletion, timeout, command boundaries, memory limits and undo/redo');
    await run(`reset('<p>输入</p>');window.changes=0;e.addEventListener('change',()=>changes++);window.before=e.content.innerHTML;`);
    await b.send('Input.imeSetComposition', {
        text: '中文',
        selectionStart: 2,
        selectionEnd: 2
    });
    assert.equal(await run('return e._composing;'), true);
    assert.equal(await run('return changes;'), 0, 'no intermediate composition changes');
    await b.send('Input.insertText', {
        text: '中文'
    });
    assert.equal(await run('return e.text;'), '输入中文');
    assert.equal(await run('return !!e._composing;'), false);
    assert.equal(await run('return changes;'), 1, 'single final composition change');
    await run('e.history.move(-1);');
    assert.equal(await run('return e.text;'), '输入', 'IME undo whole word');
    await run(`reset();e.content.dispatchEvent(new KeyboardEvent('keydown',{key:'F10',altKey:true,bubbles:true}));`);
    assert.equal(await run(`return e.toolbar.contains(e.shadowRoot.activeElement);`), true, 'Alt+F10');
    await run(`window.first=e.shadowRoot.activeElement;first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));`);
    assert.equal(await run(`return e.shadowRoot.activeElement!==first&&e.toolbar.contains(e.shadowRoot.activeElement);`), true, 'toolbar arrow');
    await run(`e.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));`);
    assert.equal(await run(`return e.shadowRoot.activeElement===e.content;`), true, 'Escape returns editor');
    console.log('PASS native Chinese composition, atomic IME undo, toolbar keyboard navigation');
    await run(`reset();window.uploads=[];e.addEventListener('upload',event=>{uploads.push(event.detail);event.detail.onComplete(event.detail.files.map((f,i)=>'https://example.com/paste-'+i+'.png'));});let data=new DataTransfer();data.items.add(new File(['png'],'screenshot.png',{type:'image/png'}));e.content.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));`);
    await b.delay(50);
    assert.equal(await run(`return uploads.length===1&&uploads[0].files[0].name==='screenshot.png'&&e._dialog.dataset.insert==='image'&&!e._dialog.querySelector('[type=submit]').disabled;`), true, 'clipboard upload');
    await run(`e._dialog.querySelector('form').requestSubmit();`);
    await b.delay(30);
    assert.equal(await run(`return e.content.querySelector('img')?.getAttribute('src');`), 'https://example.com/paste-0.png');
    await run(`reset();e.setAttribute('image','url');let data=new DataTransfer();data.items.add(new File(['png'],'blocked.png',{type:'image/png'}));e.content.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));`);
    assert.equal(await run('return e._dialog===null&&uploads.length===1;'), true, 'upload permission');
    await run(`e.removeAttribute('image');`);
    await run(`e.setAttribute('insert','table');let data=new DataTransfer();data.items.add(new File(['png'],'hidden.png',{type:'image/png'}));e.content.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));`);
    assert.equal(await run('return e._dialog===null&&uploads.length===1;'),true,'insert feature permission');
    await run(`e.removeAttribute('insert');`);

    await run(`reset();let data=new DataTransfer();data.setData('text/html','<p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">1. </span>First</p><p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">2. </span>Second</p><table><tbody><tr><td>Excel</td></tr></tbody></table><script>alert(1)</script>');e.content.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));`);
    assert.equal(await run(`return e.content.querySelectorAll('ol li').length===2&&!!e.content.querySelector('td')&&!e.value.includes('<script');`), true, 'Word and Excel paste');
    await run(`reset('<p>First</p><p>Second</p>');window.dropPoint=(()=>{let rect=e.content.querySelector('p:last-child').getBoundingClientRect();return {x:rect.x+12,y:rect.y+rect.height/2};})();let data=new DataTransfer();data.items.add(new File(['png'],'drop.png',{type:'image/png'}));e.content.dispatchEvent(new DragEvent('drop',{dataTransfer:data,clientX:dropPoint.x,clientY:dropPoint.y,bubbles:true,cancelable:true}));`);
    await b.delay(30);
    assert.equal(await run(`return e._dialog?.dataset.insert==='image'&&e.selection.range.startContainer.parentElement.closest('p')===e.content.querySelector('p:last-child');`), true, 'drop caret inside shadow DOM');
    await run(`e._dialog.dismiss();`);
    console.log('PASS clipboard files reuse upload, permissions, Word list and Excel table import');
    await run(`reset('<p><img src="https://example.com/original.png" alt="old"></p>');window.image=e.content.querySelector('img');image.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));`);
    assert.equal(await run('return !e.images.toolbar.hidden;'), true, 'image floating toolbar');
    await run(`let form=e.images.form;form.elements.alt.value='New description';form.elements.width.value='240';e.images.setAlign(2);form.requestSubmit();`);
    assert.equal(await run(`let image=e.content.querySelector('img');return image.alt==='New description'&&image.width===240&&e.value.includes('margin-left: auto;')&&e.value.includes('margin-right: auto;')&&new FormData(document.querySelector('form')).get('content')===e.value;`), true, 'image edit output/form');
    await run(`e.history.move(-1);`);
    assert.equal(await run(`return e.content.querySelector('img').alt==='old'&&!e.content.querySelector('img').hasAttribute('width');`), true, 'image edit undo');
    await run(`e.history.move(1);e.toggleSource();e.toggleSource();`);
    assert.equal(await run(`return e.content.querySelector('img').style.marginLeft==='auto';`), true, 'image style source roundtrip');
    await run(`e.content.querySelector('img').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));e.images.toolbar.querySelector('[data-image-replace]').click();e._dialog.querySelector('[data-media-tab=url]').click();e._dialog.querySelector('[name=url]').value='https://example.com/replaced.png';e._dialog.querySelector('[name=url]').dispatchEvent(new Event('input',{bubbles:true}));e._dialog.querySelector('form').requestSubmit();`);
    await b.delay(30);
    assert.equal(await run(`return e.content.querySelectorAll('img').length===1&&e.content.querySelector('img').getAttribute('src')==='https://example.com/replaced.png';`), true, 'image replacement');
    await run(`e.history.move(-1);`);
    assert.equal(await run(`return e.content.querySelector('img').alt==='New description';`), true, 'image replacement undo');
    await b.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: false
    });
    await run(`e.content.querySelector('img').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));`);
    assert.equal(await run(`let rect=e.images.toolbar.getBoundingClientRect();return rect.left>=8&&rect.right<=382&&rect.top>=8&&rect.bottom<=836;`), true, 'image toolbar small viewport');
    await run(`e.setAttribute('language','en-US');`);
    assert.equal(await run(`return e.images.toolbar.getAttribute('aria-label');`), 'Edit image');
    await run(`e.setAttribute('language','zh-CN');`);
    await b.send('Emulation.setDeviceMetricsOverride', {
        width: 1000,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false
    });
    console.log('PASS image toolbar, size, description, alignment, form, undo and source roundtrip');
    await run(`reset();window.removals=[];e.addEventListener('request',event=>event.detail.onComplete(Array.from({length:5000},(_,i)=>({original:'https://example.com/'+i+'.png',thumbnail:'/thumb'}))));e.addEventListener('remove',event=>{removals.push(event.detail.url);event.detail.onComplete();});e.openInsertDialog('image','resource');`);
    await b.delay(80);
    let initial = await run(`return {cards:e._dialog.querySelectorAll('.material-item').length,height:e._dialog.querySelector('.material-list').offsetHeight};`);
    assert.ok(initial.cards > 0 && initial.cards < 100);
    assert.ok(initial.height > 100000);
    await run(`e._dialog.querySelector('.material-select').click();let panel=e._dialog.querySelector('[data-media-panel=resource]');panel.scrollTop=panel.scrollHeight;panel.dispatchEvent(new Event('scroll'));`);
    await b.delay(80);
    await waitFor(`return !!e._dialog.querySelector('[data-index="4999"]')&&e._dialog.querySelectorAll('.material-item').length<100;`, 'bounded cards after scroll');
    await run(`e._dialog.querySelector('[data-index="4999"] .material-select').click();`);
    assert.equal(await run(`return e._dialog.querySelector('[data-count]').textContent;`), '已选 2 项', 'selection preserved across windows');
    await run(`let button=e._dialog.querySelector('[data-index="4999"] .material-select');button.focus();button.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));`);
    assert.equal(await run(`let card=e.shadowRoot.activeElement.closest('.material-item');let panel=e._dialog.querySelector('[data-media-panel=resource]');return card?.dataset.index==='0'&&card.getBoundingClientRect().top>=panel.getBoundingClientRect().top;`), true, 'virtual grid Home focuses visible card');
    await run(`e._dialog.querySelector('[data-index="0"] .material-remove').click();`);
    await b.delay(50);
    assert.equal(await run(`return removals.length===1&&e._dialog.querySelector('[data-count]').textContent==='已选 1 项';`), true, 'remove virtual item');
    await run(`e._dialog.querySelector('form').requestSubmit();`);
    await b.delay(30);
    assert.equal(await run(`return e.content.querySelector('img').getAttribute('src');`), 'https://example.com/4999.png', 'insert original outside initial window');
    console.log('PASS 5000 materials, bounded DOM, scrolling, keyboard, persistent selection, remove and insert');
    await run(`reset(Array.from({length:400},(_,i)=>'<p>Paragraph '+i+'</p>').join('')+'<pre><code data-language="javascript">const stable = true;</code></pre>');window.unchangedCode=e.content.querySelector('code');caret('p');`);
    await b.send('Input.insertText', {
        text: ' edited'
    });
    assert.equal(await run(`return e.content.querySelectorAll('p:not([data-block-boundary])').length===400&&e.content.querySelector('code')===unchangedCode&&e.value.includes('Paragraph 0 edited')&&new FormData(document.querySelector('form')).get('content')===e.value;`), true, 'long document preserves nodes and synchronous form output');
    await run(`e.content.querySelector('p').innerHTML='<div>Direct DOM</div>';await Promise.resolve();e.normalizeContent();`);
    assert.equal(await run(`return !e.content.querySelector('p div')&&e.value.includes('Direct DOM');`), true, 'observer sees external DOM changes');
    console.log('PASS long document output, unchanged code nodes and external DOM normalization');
    await run(`reset();for(let kind of ['image','video','audio','attachment']){let attr=kind+'-limit';if(e.config.get(attr)!==1&&kind!=='image')throw Error('Default limit');e.setAttribute(attr,'2');if(e.config.get(attr)!==2)throw Error('Configured limit');let dialog=e.openInsertDialog(kind,'upload');if(!dialog.querySelector('[name=file]').multiple)throw Error('Multiple file input');e.setAttribute(attr,'1');if(e._dialog!==null)throw Error('Changing limit must close dialog');e.setAttribute(attr,'');if(e.config.get(attr)!==Infinity)throw Error('Empty limit');e.setAttribute(attr,'0');if(e.config.get(attr)!==1)throw Error('Invalid limit');e.removeAttribute(attr);if(e.config.get(attr)!==1)throw Error('Default restored');}`);
    console.log('PASS image/video/audio/attachment limit attributes, file inputs and dynamic invalidation');
    await run(`reset();e.value='';if(['checkValidity','reportValidity','setCustomValidity','validity','validationMessage','willValidate'].some(name=>name in e))throw Error('Unexpected validation API');if('message' in e.formControl)throw Error('Custom validation state remains');e.required=true;if(document.querySelector('form').checkValidity())throw Error('Required form validation');e.value='<p>已填写</p>';if(!document.querySelector('form').checkValidity())throw Error('Filled form validation');e.required=false;`);
    console.log('PASS native form required validation without editor validation APIs');
    assert.deepEqual(b.logs, []);
} finally {
    await b?.close();
    await new Promise(resolve => server.close(resolve));
}
