
/**
 * 将模板进行词法分析，解析成 tokens 
 * @param {String} template 模板字符串
 */
const tokenize = (template) => {
    const tokens = []
    // 6 中状态
    const State = {
        Init: 1,
        TagOpen: 2,
        TagName: 3,
        Text: 4,
        TagEnd: 5,
        TagEndName: 6
    }

    const isAlpha = (char) => {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
    }

    const n = template.length
    const chars = []
    let state = State.Init
    let i = 0
    
    while (i < n) {
        const char = template[i]
        
        switch(state) {
            // 初始状态
            case State.Init:
                if(char == '<') {
                    state = State.TagOpen
                    // 消费当前字符
                    i++
                }else if(isAlpha(char)) {
                    state = State.Text
                }
                break;
            case State.TagOpen:
                if(isAlpha(char)) {
                    state = State.TagName
                }else if(char == '/'){
                    state = State.TagEnd
                    i++
                }
                break;
            case State.TagName:
                if(isAlpha(char)) {
                    chars.push(char)
                    i++
                }else if(char == '>') {
                    state = State.Init
                    tokens.push({
                        type: 'tag',
                        name: chars.join('')
                    })
                    chars.length = 0
                    i++
                }
                break;
            case State.Text:
                if(isAlpha(char)) {
                    chars.push(char)
                    i++
                }else if(char == '<') {
                    state = State.Init
                    tokens.push({
                        type: 'text',
                        content: chars.join('')
                    })
                    chars.length = 0
                }
                break;
            case State.TagEnd:
                if(isAlpha(char)) {
                    state = State.TagEndName
                }
                break;
            case State.TagEndName:
                if(isAlpha(char)) {
                    chars.push(char)
                    i++
                }else if(char == '>') {
                    state = State.Init
                    tokens.push({
                        type: 'tagEnd',
                        name: chars.join('')
                    })
                    chars.length = 0
                    i++
                }
                break;
        }
    }

    return tokens
}

/**
 * 将 token 转换成模板 AST
 * @param {Array} tokens 
 */
const parse = (tokens) => {
    const root = {
        type: 'Root',
        children: []
    }

    const stack = [root]

    tokens.forEach(token => {
        const lastElement = stack[stack.length - 1]
        switch(token.type) {
            // 入栈
            case 'tag':
                const element = {
                    type: 'Element',
                    tag: token.name,
                    children: []
                }
                lastElement.children.push(element)
                stack.push(element)
                break
            // 不入栈
            case 'text':
                const text = {
                    type: 'Text',
                    content: token.content
                }
                lastElement.children.push(text)
                break
            // 出栈
            case 'tagEnd':
                stack.pop()
                break
        }
    })

    return root
}

// const templete = `<div><p>Vue</p><p>Template</p></div>`

// const tokens = tokenize(templete)

// console.log(tokens)

// const ast = parse(tokens)

// console.log(JSON.stringify(ast, null, 2))

module.exports = (template) => {
    const tokens = tokenize(template)
    const ast = parse(tokens)
    return ast
}