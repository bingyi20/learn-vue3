const parse = require('./parse')

/**
 * 格式化打印 ast 结构
 * @param {object} ast 
 * @param {number} indent 
 */
const dump = (ast, indent = 0) => {
    console.log('-'.repeat(indent) + ast.type + ': ' + (ast.tag || ast.content || ''))

    const children = ast.children
    if (children) {
        children.forEach(child => {
            dump(child, indent + 2)
        });
    }
}

const traverse = (node, context) => {
    context.currentNode = node

    const exitFns = []
    // 1. 使用 nodeTransforms 处理节点
    context.nodeTransforms.forEach(transform => {
        const onExit = transform(context.currentNode, context)
        if (onExit) {
            exitFns.push(onExit)
        }
    })

    // 2. 递归处理子节点
    const children = node.children
    if (children) {
        children.forEach((child, index) => {
            context.parent = node
            context.currentIndex = index
            traverse(child, context)
        })
    }
    // 3. 后续遍历处理节点
    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}


const createStringLiteral = (value) => {
    return {
        type: 'StringLiteral',
        value
    }
}

const createIdentifier = (name) => {
    return {
        type: 'Identifier',
        name
    }
}

const createArrayExpression = (elements) => {
    return {
        type: 'ArrayExpression',
        elements
    }
}

const createCallExpression = (callee, arguments) => {
    return {
        type: 'CallExpression',
        callee: createIdentifier(callee),
        arguments
    }
}


const transformText = (node, context) => {
    if (node.type != 'Text') return
    node.jsNode = createStringLiteral(node.content)
}

const transformElement = (node, context) => {
    if (node.type != 'Element') return
    // 需要在后续遍历中处理，等待所有子节点处理完成
    return () => {
        const callExp = createCallExpression('h', [
            createStringLiteral(node.tag)
        ])
        // 处理后续参数
        const children = node.children
        children.length == 1 ?
            callExp.arguments.push(children[0].jsNode) :
            callExp.arguments.push(createArrayExpression(children.map(c => c.jsNode)))

        node.jsNode = callExp

    }
}

const transform = (ast) => {
    const context = {
        currentNode: null,
        parent: null,
        currentIndex: 0,
        nodeTransforms: [transformText, transformElement]
    }

    traverse(ast, context)

    return ast
}

const transformRoot = (ast) => {
    transform(ast)
    const vnodeAST = ast.children[0].jsNode
    ast.jsNode = {
        type: 'FunctionDecl',
        id: createIdentifier('render'),
        params: [],
        body: [
            {
                type: 'ReturnStatement',
                return: vnodeAST
            }
        ]
    }
}

module.exports = transformRoot