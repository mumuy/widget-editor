import terser from '@rollup/plugin-terser';                 // 代码压缩
import css from "rollup-plugin-import-css";
import pkg from './package.json' with { type:'json' };     // 获取package信息

// 版权信息
const repository = pkg.repository.url.replace(/(.+)(:\/\/.+)\.git$/,'https$2');
const now = new Date();
const date = (new Date(now.getTime()-now.getTimezoneOffset()*60000)).toISOString().substring(0,10);
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 *
 * Copyright (c) 2026-present, ${pkg.author}
 *
 * Released under the ${pkg.license} License
 * ${repository}
 *
 * Created on: ${date}
 */`;

// 面向现代浏览器保留原生语法，仅压缩 JS 和 CSS。
const commonPlugins = [
    css({minify:true}),
    terser({ecma:2022})
];

 export default [{
    input: './src/widget-editor.js',
    output:[{
        file: './dist/widget-editor.min.js',
        format: 'umd',
        banner
    }],
    plugins: commonPlugins,
    watch: {
        exclude: 'node_modules/**'
    }
}];
