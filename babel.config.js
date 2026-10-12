module.exports = {
    presets: [
        '@babel/preset-env'
    ],
    plugins: [
        ['@babel/plugin-transform-runtime',{
            version: '^7.29.7'
        }],
        '@babel/plugin-transform-class-properties',
        '@babel/plugin-syntax-import-attributes',
        '@babel/plugin-transform-private-methods'
    ]
}
