import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { browser } from './browser.mjs';

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', req.url === '/build.js' ? 'text/javascript;charset=utf-8' : 'text/html;charset=utf-8');
    res.end(req.url === '/build.js' ? await readFile(new URL('../dist/widget-editor.min.js', import.meta.url)) : '<!doctype html><meta charset="utf-8"><form><widget-editor name="content" custom="" insert=""></widget-editor></form><script src="/build.js"><\/script>');
});

await new Promise(r => server.listen(0, '127.0.0.1', r));

let b;

try {
    b = await browser('http://127.0.0.1:' + server.address().port);
    let run = b.evaluate;
    await run(`window.e=document.querySelector('widget-editor');window.changes=[];e.addEventListener('change',event=>changes.push(event.detail));window.select=(selector='p',collapse=false)=>{let range=document.createRange();range.selectNodeContents(e.content.querySelector(selector));if(collapse)range.collapse(false);e.selection.select(range);e.focus();};window.reset=(html='<p>Alpha Beta</p>')=>{e._dialog?.dismiss();e.value=html;select();changes=[];};e.toolbar.replaceChildren();reset();`);
    await run(`e.command('bold');`);
    assert.equal(await run(`return changes.length===1&&e.query('bold')&&!e._dialog&&e.toolbar.children.length===0;`), true, 'bold without toolbar');
    await run(`e.command('undo');`);
    assert.equal(await run('return e.value;'), '<p>Alpha Beta</p>');
    await run(`e.command('redo');`);
    assert.equal(await run(`return e.query('bold');`), true);
    await run(`reset();e.transaction(()=>{e.command('fontFamily','simsun');e.command('fontSize',24);e.command('color','#2876df');});`);
    assert.equal(await run(`return changes.length===1&&e.value.includes('font-family:')&&e.value.includes('font-size: 24px;')&&e.value.includes('color: #2876df;')&&e.getRange().toString()==='Alpha Beta'&&new FormData(document.querySelector('form')).get('content')===e.value;`), true, 'nested commands one event and form');
    await run(`e.command('undo');`);
    assert.equal(await run('return e.value;'), '<p>Alpha Beta</p>');
    await run(`reset();e.command('heading','h2');e.command('alignment','center');e.command('indentation');`);
    assert.equal(await run(`let h=e.content.querySelector('h2');return !!h&&getComputedStyle(h).textAlign==='center'&&h.style.textIndent==='2em';`), true);
    await run(`reset();e.command('blockquote');`);
    assert.equal(await run(`return !!e.content.querySelector('blockquote');`), true);
    await run(`e.command('blockquote');`);
    assert.equal(await run(`return !e.content.querySelector('blockquote');`), true);
    await run(`reset();e.command('link',{url:'https://example.com',text:'Alpha Beta',newWindow:false});`);
    assert.equal(await run(`let a=e.content.querySelector('a');return a?.textContent==='Alpha Beta'&&a.target==='_self'&&!e._dialog;`), true);
    await run(`select('a');e.command('unlink');`);
    assert.equal(await run(`return !e.content.querySelector('a')&&e.text==='Alpha Beta';`), true);
    console.log('PASS formatting/link commands without toolbar, nested atomic undo, selection and FormData');
    await run(`reset();select('p',true);e.command('insertMedia',{type:'image',sources:['https://example.com/1.png'],values:{alt:'description'}});window.image=e.content.querySelector('img');e.command('updateImage',{image,width:'240',alignment:2});`);
    assert.equal(await run(`return image.alt==='description'&&image.getAttribute('width')==='240'&&e.value.includes('margin-left: auto;')&&!e._dialog;`), true);
    await run(`reset();e.setAttribute('image-limit','2');select('p',true);e.command('insertMedia',{type:'image',sources:['https://example.com/1.png','https://example.com/2.png']});`);
    assert.equal(await run(`return e.content.querySelectorAll('p > img').length===2&&[...e.content.querySelectorAll('img')].every(img=>img.parentElement.querySelectorAll('img').length===1);`), true);
    await run(`reset();select('p',true);e.command('insertTable',{rows:2,columns:2,header:false});window.first=e.content.querySelector('td');window.last=e.content.querySelector('tr').lastElementChild;changes=[];e.command('tableEdit',{action:'merge',first,last});`);
    assert.equal(await run(`return e.content.querySelector('td').colSpan===2&&changes.length===1&&!e._dialog;`), true);
    await run(`e.command('undo');`);
    assert.equal(await run(`return e.content.querySelectorAll('td').length;`), 4);
    await run(`e.command('tableEdit',{action:'rowAfter',first:e.content.querySelector('td')});`);
    assert.equal(await run(`return e.content.querySelectorAll('tr').length;`), 3);
    await run(`reset();e.command('insertTable',{rows:1,columns:1});e.table.select(e.content.querySelector('th'));e.table.execute('deleteRows');`);
    assert.equal(await run(`return !e.content.querySelector('table');`), true);
    console.log('PASS direct image properties, batched images and table insertion/merge/rows/undo');
    await run(`reset();e.command('insertCode',{language:'javascript',text:'const value = 1;'});`);
    assert.equal(await run(`return e.content.querySelector('code').getAttribute('data-language')==='javascript'&&e.content.querySelector('code').textContent.includes('const value = 1;')&&changes.length===1&&!e._dialog;`), true);
    await run(String.raw`e.command('codeLanguage',{language:'typescript'});e.command('codeWrite','\nlet second = 2;');`);
    assert.equal(await run(`return e.content.querySelector('code').getAttribute('data-language')==='typescript'&&e.content.querySelector('code').textContent.includes('let second = 2;');`), true);
    await run(`e.command('undo');`);
    assert.equal(await run(`return !e.content.querySelector('code').textContent.includes('second');`), true);
    await run(`reset();window.original=e.value;changes=[];if(e.command('unknown')!==false||e.command('heading','h9')!==false||e.command('fontSize',13)!==false||e.command('link',{url:'javascript:alert(1)'})!==false||e.command('insertTable',{rows:0})!==false||e.command('insertMedia',{type:'image',sources:['javascript:alert(1)']})!==false)throw Error('Invalid command accepted');`);
    assert.equal(await run(`return e.value===original&&changes.length===0&&!e._dialog;`), true, 'invalid commands no effects');
    await run(`e.disabled=true;if(e.command('bold')!==false)throw Error('Disabled command');e.disabled=false;e._composing=true;if(e.command('bold')!==false)throw Error('Composing command');e._composing=false;e.source=true;if(e.command('bold')!==false)throw Error('Source command');e.source=false;`);
    assert.deepEqual(b.logs, []);
    console.log('PASS code commands, invalid inputs, disabled/source/composition guards and no dialogs');
} finally {
    await (b?.close());
    await new Promise(r => server.close(r));
}
