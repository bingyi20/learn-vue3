
const insert = (el, parent, anchor = null) => {
    parent.insertBefore(el, anchor)
}

const createElement = (tag) => {
    console.log(`创建 ${tag} 节点`)
    return document.createElement(tag)
}

const setElementText = (el, text) => {
    el.textContent = text
}