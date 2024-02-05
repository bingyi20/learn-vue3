const parse = require('./parse')
const transform = require('./transform')
const generate = require('./generate')


function compile (template) {
    const ast = parse(template)
    transform(ast)
    const code = generate(ast.jsNode)
    return code
}

const template = `<div><p>Vue</p><p>Template</p></div>`

console.log(compile(template))