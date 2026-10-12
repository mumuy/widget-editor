import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-import-css';
import pkg from './package.json' with { type:'json' };

// 样式随组件打包，页面无需另外引入组件 CSS。
export default {
    input:'./src/widget-editor.js',
    output:{
        file:'./dist/widget-editor.min.js',
        format:'umd',
        name:'WidgetEditor',
        banner:`/*! ${pkg.name} v${pkg.version} | MIT License | https://github.com/mumuy/widget-editor */`
    },
    plugins:[css({minify:true}),terser()],
    watch:{exclude:'node_modules/**'}
};
