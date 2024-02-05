const parse = require('./parse')
const transform = require('./transform')


const genFunctionDecl = (ast, context) => {
    // 处理 定义
    context.push(`function ${ast.id.name}(`)
    // 处理 params
    genNodeList(ast.params, context)

    context.push(') {')
    context.indent()
    // 处理函数体，假设一行一个语句
    ast.body.forEach(item => {
        genNode(item, context)
    })
    // 最后的反括号
    context.deIndent()
    context.push('}')

}

const genReturnStatement = (ast, context) => {
    context.push('return ')
    genNode(ast.return, context)
}

const genStringLiteral = (ast, context) => {
    context.push(`'${ast.value}'`)
}

const genIdentifier = (ast, context) => {
    context.push(ast.name)
}

const genArrayExpression = (ast, context) => {
    context.push('[')
    genNodeList(ast.elements, context)
    context.push(']')
}

const genCallExpression = (ast, context) => {
    context.push(`${ast.callee.name}(`)
    genNodeList(ast.arguments, context)
    context.push(')')
}

const genNodeList = (elements, context) => {
    for(let i = 0; i < elements.length; i++) {
        genNode(elements[i], context)
        if(i !== elements.length - 1) {
            context.push(', ')
        }
    }
}

const genNode = (ast, context) => {
    if(!ast) return
    switch(ast.type) {
        case 'FunctionDecl':
            genFunctionDecl(ast, context)
            break;
        case 'ReturnStatement':
            genReturnStatement(ast, context)
            break;
        case 'StringLiteral':
            genStringLiteral(ast, context)
            break;
        case 'Identifier':
            genIdentifier(ast, context)
            break;
        case 'ArrayExpression':
            genArrayExpression(ast, context)
            break;
        case 'CallExpression':
            genCallExpression(ast, context)
            break;
    }
}


/**
 * 生成最终的render函数字符串
 * @param {object} ast JS AST
 */
const generate = (ast) => {
    const context = {
        code: '',
        currentIndent: 0,
        push(value) {
            this.code += value
        },
        newLine() {
            this.push(`\n` + '  '.repeat(this.currentIndent))
        },
        indent() {
            this.currentIndent++
            this.newLine()
        },
        deIndent() {
            this.currentIndent--
            this.newLine()
        }
    }

    genNode(ast, context)

    return context.code
}

module.exports = generate