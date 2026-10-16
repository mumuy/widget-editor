# widget-editor

轻量的 Web Component 富文本编辑器。一个标签即可使用，支持文字排版、表格、媒体插入和代码高亮，输出 HTML，无第三方运行时依赖。面向现代 Chrome、Edge、Firefox 和 Safari，使用原生 Web Component、Popover 和表单关联能力。

[在线演示](https://passer-by.com/widget-editor/) · [下载组件](https://github.com/mumuy/widget-editor/raw/refs/heads/main/dist/widget-editor.min.js)

## 快速使用

下载组件文件并引入，标签内的 HTML 即为初始内容。

```html
<script src="./widget-editor.min.js" defer></script>

<widget-editor id="editor" placeholder="请输入内容…">
    <h2>开始写作</h2>
    <p>选中文字，通过工具栏调整格式。</p>
</widget-editor>

<script>
    customElements.whenDefined('widget-editor').then(function(){
        let editor = document.querySelector('#editor');
        editor.value = '<p>新的内容</p>';
        console.log(editor.value,editor.text);

        editor.addEventListener('change',function(event){
            console.log(event.detail.value,event.detail.text);
        });
    });
</script>
```

## 参数配置

列表参数使用英文逗号分隔，排列顺序就是显示顺序。未设置时使用默认值，运行时修改立即生效；重复和无效选项会被忽略。

### 配置示例

```html
<widget-editor
    custom="heading,fontSize,bold,italic,color,link,insert"
    insert="image,table,emoji"
    heading="p,h2,h3"
    fontsize="14,16,20,24"
    image="upload,url,resource"
    image-limit="9"
    view="source,fullscreen">
</widget-editor>
```

### 基础设置

`value`、`text` 为 JavaScript 属性，其余项目通过 HTML 属性配置。

| 属性 | 作用 | 默认值 |
| --- | --- | --- |
| `value` | JS 属性：读写 HTML，空字符串可清空内容 | 标签内的初始内容 |
| `text` | JS 属性：读取纯文本，只读 | 随内容生成 |
| `placeholder` | 空白时的提示文字 | 在这里开始写作… |
| `height` | 编辑区域高度，单位 px，范围 160～2000 | `480` |
| `language` | 界面语言：zh-CN 简体、zh-HK 繁体、en-US 英语 | `zh-CN` |
| `name` | 表单提交字段名，提交值为 HTML | 空字符串 |
| `form` | 关联表单的 id，用于表单外的组件 | 最近的父级表单 |
| `disabled` | 禁用编辑和操作，不参与表单提交及校验 | 不设置 |
| `required` | 启用必填校验，图片等非文本内容也有效 | 不设置 |

### 工具栏与菜单

| 属性 | 作用 | 默认值 |
| --- | --- | --- |
| `custom` | 工具栏功能及顺序；撤销、重做固定显示 | 完整工具栏 |
| `insert` | 插入菜单中的功能及顺序 | `divider,table,image,video,attachment,audio,emoji,code` |
| `view` | 底部操作及顺序：源码、全屏、手机模式 | `source,fullscreen,mobile` |
| `heading` | 标题菜单的选项及顺序 | `p,h1,h2,h3,h4,h5,h6` |
| `fontfamily` | 字体菜单的选项及顺序 | 全部字体，见可选值 |
| `fontsize` | 字号菜单的选项及顺序，数字不带 px | `12,14,16,18,20,24,28,32,36,48` |
| `alignment` | 对齐菜单：左、中、右、两端对齐 | `left,center,right,justify` |

### 媒体插入

| 属性 | 作用 | 默认值 |
| --- | --- | --- |
| `image` | 图片允许的插入方式及顺序 | `upload,url,resource` |
| `video` | 视频允许的插入方式及顺序 | `upload,url,iframe,resource` |
| `audio` | 音频允许的插入方式及顺序 | `upload,url,resource` |
| `attachment` | 附件允许的插入方式及顺序 | `upload,url,resource` |
| `image-limit` | 每次上传或选择图片的数量上限 | `1` |
| `video-limit` | 每次上传或选择视频的数量上限 | `1` |
| `audio-limit` | 每次上传或选择音频的数量上限 | `1` |
| `attachment-limit` | 每次上传或选择附件的数量上限 | `1` |

`disabled`、`required` 为布尔属性，存在即生效；取消时移除属性或将对应 JS 属性设为 `false`。`*-limit` 默认为单选，正整数表示上限，空值表示不限数量，同时约束上传和素材库选择。


### 可选值

`custom` 可使用下表全部字段；`insert` 使用“插入内容”中的字段，`view` 使用“视图操作”中的字段。

| 分组 | 字段与功能 |
| --- | --- |
| 文字格式 | `bold` 加粗 · `italic` 斜体 · `underline` 下划线 · `strikethrough` 删除线 · `superscript` 上标 · `subscript` 下标 |
| 字体与颜色 | `fontFamily` 字体 · `fontSize` 字号 · `color` 文字颜色 · `backgroundColor` 文字背景 |
| 段落排版 | `heading` 标题 · `alignment` 对齐 · `indentation` 首行缩进 · `blockquote` 引用 · `orderedList` 有序列表 · `unorderedList` 无序列表 |
| 常用操作 | `link` 超链接 · `format` 清除格式 · `formatPainter` 格式刷 · `insert` 插入菜单 |
| 插入内容 | `divider` 分割线 · `table` 表格 · `image` 图片 · `video` 视频 · `attachment` 附件 · `audio` 音频 · `emoji` 表情 · `code` 代码块 |
| 视图操作 | `source` 源码 · `fullscreen` 全屏 · `mobile` 手机模式 |

- `heading`：`p` 正文，`h1`～`h6` 标题。
- `alignment`：`left` 左对齐，`center` 居中，`right` 右对齐，`justify` 两端对齐。
- 媒体方式：`upload` 上传文件，`url` 网络地址，`resource` 素材库，`iframe` 视频嵌入。

<details>
<summary>字体字段</summary>

| 字段 | 字体 |
| --- | --- |
| `default` | 默认字体 |
| `yahei` | 微软雅黑 |
| `simsun` | 宋体 |
| `simhei` | 黑体 |
| `kaiti` | 楷体 |
| `fangsong` | 仿宋 |
| `pingfang` | 苹方 |
| `dengxian` | 等线 |
| `stsong` | 华文宋体 |
| `stkaiti` | 华文楷体 |
| `stxihei` | 华文细黑 |
| `sourceSans` | 思源黑体 |
| `sourceSerif` | 思源宋体 |

字体使用设备已安装的字体。

</details>

设为空值时，`insert` 隐藏插入菜单，`view` 隐藏底部操作，标题、字体、字号、对齐属性隐藏对应下拉框；`custom=""` 仅保留撤销和重做，媒体方式为空则禁用该类型插入。通过 `custom` 添加的独立按钮单独显示。

## 内容与方法

| 属性或方法 | 作用 |
| --- | --- |
| `getHTML() / setHTML(html)` | 读取、设置 HTML |
| `openInsertDialog(type,mode)` | 打开指定媒体插入弹框；省略 mode 时打开第一种方式 |
| `focus()` | 聚焦编辑区域 |
| `command(name,value)` | 执行内容命令，不打开弹框 |

程序设置 `value` 或调用 `setHTML()` 不触发 `change`。组件会整理输出 HTML，清理不支持的标签和属性。

### 内容命令

工具栏、快捷键和浮层共用内容命令，也可以直接调用，无需显示对应工具栏按钮。命令共用选区、撤销、HTML 整理和 `change` 事件；禁用、源码模式或输入法组合输入期间不执行。

```javascript
editor.command('bold');
editor.command('heading','h2');
editor.command('fontSize',24);
editor.command('color','#2876df');
editor.command('link',{url:'https://example.com',text:'查看详情',newWindow:true});
editor.command('insertTable',{rows:3,columns:4,header:true});
editor.command('insertMedia',{type:'image',sources:['https://example.com/photo.jpg']});
editor.command('insertCode',{language:'javascript',text:'const value = 1;'});
```

`command()` 修改内容；`openInsertDialog()` 打开媒体选择界面。命令仍使用对应的字体、字号和媒体配置，未知命令或无效参数返回 `false`。

### 打开媒体弹框

```javascript
editor.openInsertDialog('image','upload');
editor.openInsertDialog('video','iframe');
editor.openInsertDialog('audio','url');
editor.openInsertDialog('attachment','resource');
```

`type` 支持四种媒体类型，`mode` 须在对应媒体属性中开放。插入位置沿用当前光标或选区；方法不依赖工具栏按钮是否显示，无法打开时返回 `null`。

### 原生表单

设置 `name` 后可直接提交 HTML，也可以通过 `FormData` 读取。编辑器在表单外时，使用 `form="表单id"` 关联。

```html
<form id="article-form">
    <widget-editor name="content" required></widget-editor>
    <button type="submit">保存</button>
</form>

<script>
    document.querySelector('#article-form').onsubmit = function(event){
        event.preventDefault();
        let html = new FormData(this).get('content');
        console.log(html);
    };
</script>
```

支持 `required`、`disabled`、`form.reset()` 和原生表单校验。重置恢复初始内容；禁用时不参与提交。通过 `editor.form`、`editor.labels` 可读取表单信息。

## 事件

事件通过 `event.detail` 提供数据，并支持冒泡。监听 `ready` 时应在组件加入页面前绑定；读取已注册组件可使用 `customElements.whenDefined()`。

| 事件 | 触发时机 | detail |
| --- | --- | --- |
| `ready` | 组件首次初始化完成 | 无 |
| `change` | 用户编辑内容或执行编辑操作 | `value`、`text` |
| `upload` | 选择文件并通过校验 | `files`、`type`、`limit`、`onComplete`、`onError`、`onProgress` |
| `request` | 打开素材库标签 | `type`、`limit`、`onComplete`、`onError` |
| `add` | 在素材库中选择上传文件 | 与 upload 相同 |
| `remove` | 点击素材的移除按钮 | `type`、`url`、`limit`、`onComplete`、`onError` |

## 上传与素材库

组件负责选择、校验和插入，文件上传与素材管理由业务页面处理。文件选择后触发事件，成功回调后由用户点击“插入”。

### 文件上传

`upload` 和素材库中的 `add` 可共用一个处理函数。示例接口 `/api/upload` 接收多个 `files` 字段及 `type`，返回 `{urls: [...]}`。

```javascript
let editor = document.querySelector('#editor');

async function upload(event){
    let {files,type,onComplete,onError} = event.detail;
    let data = new FormData();
    files.forEach(file=>data.append('files',file));
    data.append('type',type);
    try{
        let response = await fetch('/api/upload',{method:'POST',body:data});
        if(!response.ok){throw new Error('上传失败');}
        let result = await response.json();
        onComplete(result.urls);
    }catch(error){
        onError(error);
    }
}
editor.addEventListener('upload',upload);
editor.addEventListener('add',upload);
```

### 素材库

配置 `image="upload,url,resource"` 等属性即可显示素材库。打开标签触发 `request`，返回列表后选择素材并插入。

```javascript
editor.addEventListener('request',async function(event){
    let {type,onComplete,onError} = event.detail;
    try{
        let response = await fetch('/api/materials?type='+encodeURIComponent(type));
        if(!response.ok){throw new Error('素材加载失败');}
        let result = await response.json();
        onComplete(result.urls);
    }catch(error){
        onError(error);
    }
});
```

素材库的“上传素材”触发 `add`，成功后新素材显示在列表前面；移除按钮触发 `remove`，业务删除成功后调用 `onComplete()` 才移除列表项，已插入文档的内容不受影响。

<details>
<summary>移除素材</summary>

```javascript
editor.addEventListener('remove',async function(event){
    let {type,url,onComplete,onError} = event.detail;
    try{
        let response = await fetch('/api/materials',{
            method:'DELETE',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({type,url})
        });
        if(!response.ok){throw new Error('素材移除失败');}
        onComplete();
    }catch(error){
        onError(error);
    }
});
```

</details>

### 回调参数

| 字段 | 作用 |
| --- | --- |
| `type` | image、video、audio、attachment |
| `limit` | 本次上传或选择数量上限；不限数量时为 Infinity |
| `files` | File[]，单文件也是数组；仅 upload、add 提供 |
| `url` | 待移除素材的原地址；仅 remove 提供 |
| `onComplete(items)` | 上传、加载或新增完成，传入素材数组；移除完成时不传参数 |
| `onError(error)` | 失败时传入 Error 或错误消息 |
| `onProgress(percent)` | 更新上传进度，范围 0～100；仅 upload、add 提供 |

素材数组支持 URL 字符串或 `{original,thumbnail}` 对象，可混用。`thumbnail` 用于预览，`original` 用于插入，省略缩略图时使用原地址。

```javascript
onComplete([
    'https://example.com/photo.jpg',
    {
        original:'https://example.com/original.jpg',
        thumbnail:'https://example.com/thumbnail.jpg'
    }
]);
```

上传与新增时，返回数组须与 `files` 数量相同、顺序对应；加载素材库时可返回任意数量，空数组表示暂无素材。回调仅生效一次，关闭弹框或更改相关权限后，未完成回调失效。

<details>
<summary>文件格式与大小</summary>

| 类型 | 支持格式 | 单个文件上限 |
| --- | --- | --- |
| 图片 | PNG、JPEG、GIF、WebP | 5 MB |
| 视频 | MP4、WebM、Ogg | 50 MB |
| 音频 | MP3、WAV、Ogg、M4A、AAC、FLAC、WebM | 20 MB |
| 附件 | 任意文件 | 20 MB |

</details>

截图和文件粘贴、拖入会复用上传流程。点击正文图片可编辑地址、描述、宽度、对齐或替换图片。视频及 iframe 按 16:9 显示。

## 外观与快捷键

通过 CSS 变量调整配色、边距，通过 `::part` 调整下拉菜单与图标。

```css
widget-editor{
    --button-active-color: #2876df;
    --panel-border-color: #dce2e9;
    --editor-padding-x: 24px;
    --editor-padding-y: 24px;
}
widget-editor::part(dropdown-menu){
    border-radius: 6px;
}
```

| 快捷键 | 操作 |
| --- | --- |
| Ctrl / Command + B、I、U | 加粗、斜体、下划线 |
| Ctrl / Command + Z | 撤销 |
| Ctrl / Command + Shift + Z / Y | 重做 |
| Alt + F10 | 聚焦工具栏 |
| 工具栏内 ← / →、Home / End | 切换按钮 |
| 素材库内方向键、Home / End | 移动素材焦点 |
| Enter / Shift + Enter | 新段落 / 段内换行 |
| Escape | 关闭浮层，或从工具栏返回编辑区 |

连续输入和删除合并撤销，停顿、移动光标或执行命令会开始新记录，中文输入法确认独立记录。源码、全屏和可编辑手机模式由 `view` 配置。

## 许可

[MIT](LICENSE)
