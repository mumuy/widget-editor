import {test,expect} from '@playwright/test';

const imageFixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQTYAAAAASUVORK5CYII=','base64');

async function editorOn(page,html = '<p>欢迎使用富文本编辑器</p>'){
    await page.goto('/');
    const editor = page.locator('widget-editor').first();
    await expect(editor.locator('.editor-content')).toBeVisible();
    await editor.evaluate((element,value)=>{element.value = value;},html);
    return editor;
}

async function selectText(editor,text,occurrence = 0){
    await editor.evaluate((element,{text,occurrence})=>{
        const content = element.shadowRoot.querySelector('.editor-content');
        const walker = document.createTreeWalker(content,NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while((node = walker.nextNode())){
            nodes.push(node);
        }
        const joined = nodes.map(item=>item.textContent).join('');
        let start = -1;
        for(let index = 0;index <= occurrence;index++){
            start = joined.indexOf(text,start + 1);
        }
        if(start < 0){
            throw new Error('Cannot select text: ' + text);
        }
        const end = start + text.length;
        let offset = 0;
        const range = document.createRange();
        let started = false;
        for(const item of nodes){
            const length = item.textContent.length;
            if(!started && start >= offset && start < offset + length){
                range.setStart(item,start - offset);
                started = true;
            }
            if(started && end >= offset && end <= offset + length){
                range.setEnd(item,end - offset);
                break;
            }
            offset += length;
        }
        content.focus();
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        content.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,composed:true}));
        document.dispatchEvent(new Event('selectionchange'));
    },{text,occurrence});
}

async function styleOf(editor,text,property){
    return editor.evaluate((element,{text,property})=>{
        const content = element.shadowRoot.querySelector('.editor-content');
        const walker = document.createTreeWalker(content,NodeFilter.SHOW_TEXT);
        let node;
        while((node = walker.nextNode())){
            if(node.textContent.includes(text)){
                return getComputedStyle(node.parentElement)[property];
            }
        }
        return '';
    },{text,property});
}

async function caretAtEnd(editor){
    await editor.evaluate(element=>{
        const content = element.shadowRoot.querySelector('.editor-content');
        content.focus();
        const range = document.createRange();
        range.selectNodeContents(content);
        range.collapse(false);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
    });
}

test('toolbar applies inline formatting and clears selected formatting',async({page})=>{
    const editor = await editorOn(page,'<p>加粗 斜体 清除</p>');
    await selectText(editor,'加粗');
    await editor.locator('[data-action="bold"]').click();
    await expect.poll(()=>styleOf(editor,'加粗','fontWeight')).toMatch(/^(bold|[7-9]00)$/);
    await selectText(editor,'斜体');
    await editor.locator('[data-action="italic"]').click();
    await expect.poll(()=>styleOf(editor,'斜体','fontStyle')).toBe('italic');
    await selectText(editor,'加粗');
    await editor.locator('[data-action="format"]').click();
    await expect.poll(()=>styleOf(editor,'加粗','fontWeight')).toMatch(/^(normal|400)$/);
    await expect(editor.locator('.editor-content')).toHaveText('加粗 斜体 清除');
});

test('all heading levels and both list types preserve selected text',async({page})=>{
    const editor = await editorOn(page,'<p>标题内容</p>');
    for(let level = 1;level <= 6;level++){
        await selectText(editor,'标题内容');
        await editor.locator('[data-action="heading"]').selectOption('h' + level);
        await expect(editor.locator('.editor-content h' + level)).toHaveText('标题内容');
    }
    await selectText(editor,'标题内容');
    await editor.locator('[data-action="heading"]').selectOption('p');
    await expect(editor.locator('.editor-content p')).toHaveText('标题内容');
    for(const [action,tag] of [['orderedList','ol'],['unorderedList','ul']]){
        await editor.evaluate(element=>{element.value = '<p>列表项目</p>';});
        await selectText(editor,'列表项目');
        await editor.locator('[data-action="' + action + '"]').click();
        await expect(editor.locator('.editor-content ' + tag + ' li')).toHaveText('列表项目');
    }
});

test('alignment, font size and color affect only the intended selection',async({page})=>{
    const editor = await editorOn(page,'<p>彩色文字 普通文字</p>');
    await selectText(editor,'彩色文字');
    await editor.locator('[data-action="alignment"]').selectOption('center');
    await expect.poll(()=>styleOf(editor,'彩色文字','textAlign')).toBe('center');
    await selectText(editor,'彩色文字');
    await editor.locator('[data-action="fontSize"]').selectOption('24');
    await expect.poll(()=>styleOf(editor,'彩色文字','fontSize')).toBe('24px');
    await selectText(editor,'彩色文字');
    await editor.locator('[data-action="color"]').fill('#ff0000');
    await editor.locator('[data-action="color"]').dispatchEvent('change');
    await expect.poll(()=>styleOf(editor,'彩色文字','color')).toBe('rgb(255, 0, 0)');
    await expect.poll(()=>styleOf(editor,'普通文字','color')).not.toBe('rgb(255, 0, 0)');
});

test('font sizing preserves paragraphs and links, and applies to newly typed text at a caret',async({page})=>{
    const editor = await editorOn(page,'<p><a href="https://example.com">第一段</a></p><p>第二段</p>');
    await selectText(editor,'第一段第二段');
    await editor.locator('[data-action="fontSize"]').selectOption('20');
    await expect(editor.locator('.editor-content p')).toHaveCount(2);
    await expect(editor.locator('.editor-content a')).toHaveText('第一段');
    await expect(editor.locator('.editor-content a')).toHaveAttribute('href','https://example.com');
    await expect.poll(()=>styleOf(editor,'第一段','fontSize')).toBe('20px');
    await expect.poll(()=>styleOf(editor,'第二段','fontSize')).toBe('20px');
    await editor.evaluate(element=>{element.value = '<p>键入位置</p>';});
    await selectText(editor,'键入位置');
    await page.keyboard.press('ArrowRight');
    await editor.locator('[data-action="fontSize"]').selectOption('28');
    await page.keyboard.type('新增');
    await expect.poll(()=>editor.evaluate(element=>element.text)).toBe('键入位置新增');
    await expect.poll(()=>styleOf(editor,'新增','fontSize')).toBe('28px');
    await expect(editor.locator('.editor-content p')).toHaveCount(1);
});

test('format painter copies formatting once',async({page})=>{
    const editor = await editorOn(page,'<p><span style="font-weight:bold;font-style:italic;color:#ff0000;font-size:24px">样式来源</span> 目标文字 后续文字</p>');
    const painter = editor.locator('[data-action="formatPainter"]');
    await selectText(editor,'样式来源');
    await painter.click();
    await selectText(editor,'目标文字');
    await expect.poll(()=>styleOf(editor,'目标文字','fontWeight')).toMatch(/^(bold|[7-9]00)$/);
    await expect.poll(()=>styleOf(editor,'目标文字','fontStyle')).toBe('italic');
    await expect.poll(()=>styleOf(editor,'目标文字','color')).toBe('rgb(255, 0, 0)');
    await expect.poll(()=>styleOf(editor,'目标文字','fontSize')).toBe('24px');
    await selectText(editor,'后续文字');
    await expect.poll(()=>styleOf(editor,'后续文字','fontStyle')).toBe('normal');
});

test('source editing round-trips HTML while removing executable markup',async({page})=>{
    const editor = await editorOn(page,'<p>原始内容</p>');
    await editor.locator('[data-action="source"]').click();
    const source = editor.locator('.editor-source');
    await expect(source).toBeVisible();
    await expect(source).toHaveValue('<p>原始内容</p>');
    await source.fill('<h2>新标题</h2><p onclick="window.__unsafe = true">安全内容<script>window.__unsafe = true</script></p><a href="javascript:alert(1)">恶意链接</a><img src="x" onerror="window.__unsafe = true"><iframe srcdoc="<script>alert(1)</script>"></iframe>');
    await editor.locator('[data-action="source"]').click();
    await expect(editor.locator('.editor-content h2')).toHaveText('新标题');
    const value = await editor.evaluate(element=>element.value);
    expect(value).not.toMatch(/<script|<iframe|\sonclick=|\sonerror=|javascript:/i);
    expect(await page.evaluate(()=>window.__unsafe)).toBeUndefined();
    await editor.locator('[data-action="source"]').click();
    await expect(source).toHaveValue(value);
});

test('HTML formatting indents block structure and preserves inline and preformatted text',async({page})=>{
    const preformatted = '  const value = 1;\n    console.log(value);';
    const editor = await editorOn(page,'<div><p>前缀 <strong>加粗</strong> 尾部</p><table><tbody><tr><td>值</td></tr></tbody></table><pre>' + preformatted + '</pre></div>');
    await editor.locator('[data-action="formatHTML"]').click();
    const source = editor.locator('.editor-source');
    await expect(source).toBeVisible();
    const formatted = await source.inputValue();
    expect(formatted).toContain('\n    <p>前缀 <strong>加粗</strong> 尾部</p>');
    expect(formatted).toContain('\n        <tbody>');
    expect(formatted).toContain('\n            <tr>');
    expect(formatted).toContain('<pre>' + preformatted + '</pre>');
    await editor.locator('[data-action="formatHTML"]').click();
    await expect(source).toHaveValue(formatted);
    await editor.locator('[data-action="source"]').click();
    await expect(editor.locator('.editor-content p')).toHaveText('前缀 加粗 尾部');
    await expect(editor.locator('.editor-content p strong')).toHaveText('加粗');
    await expect(editor.locator('.editor-content table td')).toHaveText('值');
    expect(await editor.locator('.editor-content pre').textContent()).toBe(preformatted);
});

test('link dialog inserts safe links, escapes text and rejects unsafe URLs',async({page})=>{
    const editor = await editorOn(page,'<p>网站链接</p>');
    await selectText(editor,'网站链接');
    await editor.locator('[data-action="link"]').click();
    const dialog = editor.locator('dialog[open]');
    await dialog.locator('[name="url"]').fill('https://example.com/docs?topic=editor');
    await dialog.locator('[name="text"]').fill('<示例 & 文档>');
    await dialog.locator('button[type="submit"]').click();
    const link = editor.locator('.editor-content a');
    await expect(link).toHaveAttribute('href','https://example.com/docs?topic=editor');
    await expect(link).toHaveText('<示例 & 文档>');
    await expect(link.locator('*')).toHaveCount(0);
    await selectText(editor,'<示例 & 文档>');
    await editor.locator('[data-action="link"]').click();
    await dialog.locator('[name="url"]').fill('javascript:alert(1)');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeVisible();
    await expect(editor.locator('.editor-content a[href^="javascript:"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
});

test('image upload embeds a local image and preserves its alternate text',async({page})=>{
    const editor = await editorOn(page,'<p>图片位置</p>');
    await caretAtEnd(editor);
    await editor.locator('[data-action="image"]').click();
    const dialog = editor.locator('dialog[open]');
    await dialog.locator('[name="file"]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeVisible();
    await expect(editor.locator('.editor-content img')).toHaveCount(0);
    await dialog.locator('[name="file"]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:imageFixture});
    await dialog.locator('[name="alt"]').fill('图片 <说明> & 示例');
    await dialog.locator('button[type="submit"]').click();
    const image = editor.locator('.editor-content img');
    await expect(image).toHaveAttribute('src',/^data:image\/png;base64,/);
    await expect(image).toHaveAttribute('alt','图片 <说明> & 示例');
    await expect.poll(()=>image.evaluate(element=>element.complete && element.naturalWidth > 0)).toBe(true);
});

test('an image read cannot insert into the editor after its dialog is replaced',async({page})=>{
    const editor = await editorOn(page,'<p>保留内容</p>');
    await page.evaluate(()=>{
        const OriginalFileReader = window.FileReader;
        window.FileReader = class extends OriginalFileReader {
            readAsDataURL(file){
                window.resumeImageRead = ()=>{
                    this.addEventListener('load',()=>{window.imageReadCompleted = true;});
                    super.readAsDataURL(file);
                };
            }
        };
    });
    await caretAtEnd(editor);
    await editor.locator('[data-action="image"]').click();
    await editor.locator('dialog[open] [name="file"]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:imageFixture});
    await editor.locator('dialog[open] button[type="submit"]').click();
    await expect.poll(()=>page.evaluate(()=>typeof window.resumeImageRead)).toBe('function');
    await editor.locator('[data-action="link"]').click();
    await expect(editor.locator('dialog[open] [name="url"]')).toBeVisible();
    await page.evaluate(()=>window.resumeImageRead());
    await expect.poll(()=>page.evaluate(()=>window.imageReadCompleted)).toBe(true);
    await expect(editor.locator('.editor-content img')).toHaveCount(0);
    await expect(editor.locator('dialog[open] [name="url"]')).toBeVisible();
    await expect(editor.locator('.editor-content')).toHaveText('保留内容');
});

test('table dialog creates the requested dimensions and optional header',async({page})=>{
    const editor = await editorOn(page,'<p>表格位置</p>');
    await caretAtEnd(editor);
    await editor.locator('[data-action="table"]').click();
    const dialog = editor.locator('dialog[open]');
    await dialog.locator('[name="rows"]').fill('3');
    await dialog.locator('[name="columns"]').fill('4');
    await dialog.locator('[name="header"]').check();
    await dialog.locator('button[type="submit"]').click();
    const table = editor.locator('.editor-content table');
    await expect(table.locator('tr')).toHaveCount(3);
    await expect(table.locator('th')).toHaveCount(4);
    await expect(table.locator('td')).toHaveCount(8);
    await editor.locator('[data-action="source"]').click();
    await editor.locator('[data-action="source"]').click();
    await expect(table.locator('tr')).toHaveCount(3);
    await expect(table.locator('th')).toHaveCount(4);
    await editor.evaluate(element=>{element.value = '<p>无表头</p>';});
    await caretAtEnd(editor);
    await editor.locator('[data-action="table"]').click();
    await dialog.locator('[name="rows"]').fill('2');
    await dialog.locator('[name="columns"]').fill('3');
    await dialog.locator('[name="header"]').uncheck();
    await dialog.locator('button[type="submit"]').click();
    await expect(table.locator('tr')).toHaveCount(2);
    await expect(table.locator('th')).toHaveCount(0);
    await expect(table.locator('td')).toHaveCount(6);
});

test('undo and redo restore edits; setting value starts a new history',async({page})=>{
    const editor = await editorOn(page,'<p>内容</p>');
    await caretAtEnd(editor);
    await page.keyboard.type('!');
    await expect(editor.locator('.editor-content')).toHaveText('内容!');
    await editor.locator('[data-action="undo"]').click();
    await expect(editor.locator('.editor-content')).toHaveText('内容');
    await editor.locator('[data-action="redo"]').click();
    await expect(editor.locator('.editor-content')).toHaveText('内容!');
    await editor.evaluate(element=>{element.value = '<p>新内容</p>';});
    await expect(editor.locator('[data-action="undo"]')).toBeDisabled();
    await expect(editor.locator('[data-action="redo"]')).toBeDisabled();
    await expect(editor.locator('.editor-content')).toHaveText('新内容');
});

test('keyboard shortcuts, paste sanitizing and change events work independently per instance',async({page})=>{
    const editor = await editorOn(page,'<p>快捷键文字</p>');
    await page.evaluate(()=>{
        const other = document.createElement('widget-editor');
        other.id = 'second-editor';
        document.body.appendChild(other);
        other.value = '<p>第二个编辑器</p>';
        const first = document.querySelector('widget-editor');
        first.testChanges = [];
        first.addEventListener('change',event=>first.testChanges.push(event.detail));
    });
    await selectText(editor,'快捷键文字');
    await page.keyboard.press('Control+b');
    await expect.poll(()=>styleOf(editor,'快捷键文字','fontWeight')).toMatch(/^(bold|[7-9]00)$/);
    await expect(page.locator('#second-editor .editor-content')).toHaveText('第二个编辑器');
    await caretAtEnd(editor);
    await editor.locator('.editor-content').evaluate(content=>{
        const transfer = new DataTransfer();
        transfer.setData('text/html','<p onclick="alert(1)"><strong>粘贴内容</strong><script>window.__pasteUnsafe=true</script><a href="javascript:alert(1)">链接</a></p>');
        transfer.setData('text/plain','粘贴内容链接');
        content.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:transfer}));
    });
    await expect(editor.locator('.editor-content')).toContainText('粘贴内容');
    const value = await editor.evaluate(element=>element.value);
    expect(value).not.toMatch(/<script|\sonclick=|javascript:/i);
    expect(await page.evaluate(()=>window.__pasteUnsafe)).toBeUndefined();
    const change = await editor.evaluate(element=>element.testChanges.at(-1));
    expect(change.value).toBe(value);
    expect(change.text).toContain('粘贴内容');
    await expect(page.locator('#second-editor .editor-content')).toHaveText('第二个编辑器');
});

test('stylesheet fallback supports both themes without accumulating style elements',async({page})=>{
    await page.addInitScript(()=>{
        Object.defineProperty(ShadowRoot.prototype,'adoptedStyleSheets',{
            configurable:true,
            get(){return undefined;}
        });
    });
    const editor = await editorOn(page);
    const fallback = editor.locator('style[data-widget-editor]');
    const panel = editor.locator('.mod-panel');
    await expect(fallback).toHaveCount(1);
    await expect(panel).toHaveCSS('background-color','rgb(255, 255, 255)');
    await editor.evaluate(element=>{
        element.setAttribute('theme','dark');
        element.addStyle();
        element.addStyle();
    });
    await expect(fallback).toHaveCount(1);
    await expect(panel).toHaveCSS('background-color','rgb(35, 42, 52)');
});

test('demo renders without browser errors and fits a mobile viewport',async({page})=>{
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    await expect(page.locator('widget-editor').first().locator('.editor-content')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
});
