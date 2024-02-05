
const createRenderer = function (options) {
    const {
        createElement,
        setElementText,
        insert,
        createTextNode,
        createCommentNode
    } = options

    function shouldProperty(el, key) {
        if (['form'].includes(key)) return false
        return key in el
    }

    function patchProps(el, key, prevVal, newVal) {
        if (/^on/.test(key)) {
            // 处理事件
            const eventName = key.slice(2).toLowerCase()
            // __evi => [key, invoke]
            const evi = el.__evi || (el.__evi = {})

            // 首次需要绑定对应事件
            if (!evi[eventName]) {
                const _invoke = function (e) {
                    const callbacks = _invoke.value
                    callbacks && callbacks.forEach(c => c(e))
                }
                evi[eventName] = _invoke
                el.addEventListener(eventName, _invoke)
            }

            const invoke = evi[eventName]
            if (newVal) {
                invoke.value = Array.isArray(newVal) ? newVal : [newVal]
            } else {
                invoke.value = null
            }

        } else {
            // 处理属性
            if (shouldProperty(el, key)) {
                if (typeof el[key] == 'boolean' && newVal == '') {
                    el[key] = true
                } else {
                    el[key] = newVal
                }
            } else {
                el.setAttribute(key, newVal)
            }
        }

    }

    /**
     * 挂载虚拟节点
     * @param {Vnode} vnode  
     * @param {Element} container 
     */
    function mountElement(vnode, container) {
        const el = vnode.el = createElement(vnode.type)
        // 处理 props
        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }
        // 处理子节点
        if (typeof vnode.children == 'string') {
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {
            vnode.children.forEach(c => {
                patch(null, c, el)
            });
        }
        // 挂载
        insert(el, container)
    }

    /**
     * 移除虚拟节点山的 dom
     * @param {Vnode} vnode 
     */
    function unmount(vnode) {
        if (vnode.type == Fragment) {
            vnode.children.forEach(c => unmount(c))
        } else {
            const el = vnode.el
            const parent = el.parentNode
            if (parent) {
                parent.removeChild(el)
            }
        }
    }

    function sameVnode(n1, n2) {
        return n1.key == n2.key && n1.type == n2.type
    }

    /**
     * 两个 vnode 打补丁
     * @param {Vnode} n1 old vnode
     * @param {Vnode} n2 new vnode
     * @param {Element} container 
     */
    function patch(n1, n2, container) {
        // 1. 类型一致性处理
        if (n1 && n1.type != n2.type) {
            unmount(n1)
            n1 = null
        }

        // 2. n2 各种不同类型分别处理
        const { type } = n2

        if (typeof type == 'string') {
            if (!n1) {
                mountElement(n2, container)
            } else {
                patchElement(n1, n2, container)
            }
        } else if (type === Text) {
            if (!n1) {
                const el = n2.el = createTextNode(n2.children)
                insert(el, container)
            } else {
                const el = n2.el = n1.el
                setElementText(el, n2.children)
            }
        } else if (type === Comment) {
            if (!n1) {
                const el = n2.el = createCommentNode(n2.children)
                insert(el, container)
            } else {
                const el = n2.el = n1.el
                setElementText(el, n2.children)
            }
        } else if (type === Fragment) {
            // Fragment 需要做穿透处理，自身不渲染任何元素
            if (!n1) {
                // 直接挂载子节点
                n2.children.forEach(c => mountElement(c, container))
            } else {
                // 直接 patch 子节点
                patchChildren(n1, n2, container)
            }
        } else if (typeof type == 'object') {
            // 组件类型
        }
    }


    /**
     * 相同元素节点间打补丁
     * @param {Vnode} n1 
     * @param {Vnode} n2 
     * @param {Element} container 
     */
    function patchElement(n1, n2, container) {
        // 复用 dom
        const el = n2.el = n1.el
        // 处理 props
        const oldProps = n1.props
        const newProps = n2.props

        for (const key in newProps) {
            patchProps(el, key, oldProps[key], newProps[key])
        }

        for (const key in oldProps) {
            if (newProps[key] === undefined) {
                patchProps(el, key, oldProps[key], null)
            }
        }

        // 处理子节点
        patchChildren(n1, n2, el)
    }

    /**
     * patch 新旧节点间的子孩子
     * @param {Vnode} n1 
     * @param {Vnode} n2 
     * @param {Element} container 
     */
    function patchChildren(n1, n2, container) {
        const oldChildren = n1.children
        const newChildren = n2.children

        if (typeof newChildren == 'string') {
            if (Array.isArray(oldChildren)) {
                oldChildren.forEach(c => unmount(c))
            }
            if(oldChildren != newChildren) {
                setElementText(container, newChildren)
            }
        } else if (Array.isArray(newChildren)) {
            if (typeof oldChildren == 'string') {
                setElementText(container, '')
            } else if (Array.isArray(oldChildren)) {
                // TODO: 这里涉及核心 dom diff 算法
                // 方法1: 直接遍历按顺序 patch
                // const oldLen = oldChildren.length
                // const newLen = newChildren.length
                // const minLen = Math.min(oldLen, newLen)
                // // 按照顺序遍历 patch
                // for(let i = 0; i < minLen; i++) {
                //     patch(oldChildren[i], newChildren[i], container)
                // }
                // // 如果老的有剩余，需要移除
                // if(oldLen > minLen) {
                //     for(let k = minLen; k < oldLen; k++) {
                //         unmount(oldChildren[k])
                //     }
                // }
                // // 如果新的有剩余，需要挂载
                // if(newLen > minLen) {
                //     for(let k = minLen; k < newLen; k++) {
                //         patch(null, newChildren[k], container)
                //     }
                // }

                // 方法二： 快速 diff，使用 key 索引
                patchDoubleChildren(n1, n2, container)

            } else {
                newChildren.forEach(c => mountElement(c, container))
            }
        } else if (newChildren == null) {
            if (Array.isArray(oldChildren)) {
                oldChildren.forEach(c => unmount(c))
            }
            setElementText(container, '')
        }
    }

    function patchDoubleChildren(n1, n2, container) {
        const oldChildren = n1.children
        const newChildren = n2.children
        const oldLen = oldChildren.length
        const newLen = newChildren.length

        // 四个索引值
        let oldStartIdx = 0, oldEndIdx = oldLen - 1
        let newStartIdx = 0, newEndIdx = newLen - 1
        // 四个索引方向执行的 vnode 节点
        let oldStartVnode = oldChildren[oldStartIdx], oldEndVnode = oldChildren[oldEndIdx]
        let newStartVnode = newChildren[newStartIdx], newEndVnode = newChildren[newEndIdx]

        while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            // 处理 old 被移除的情况
            while(!oldStartVnode) {
                oldStartVnode = oldChildren[++oldStartIdx]
            }
            while(!oldEndVnode) {
                oldEndVnode = oldChildren[--oldEndIdx]
            }

            if(sameVnode(newStartVnode, oldStartVnode)) {
                // 首-首
                patch(oldStartVnode, newStartVnode, container)
                newStartVnode = newChildren[++newStartIdx]
                oldStartVnode = oldChildren[++oldStartIdx]
            }else if(sameVnode(newEndVnode, oldEndVnode)) {
                // 尾-尾
                patch(oldEndVnode, newEndVnode, container)
                newEndVnode = newChildren[--newEndIdx]
                oldEndVnode = oldChildren[--oldEndIdx]
            }else if(sameVnode(newStartVnode, oldEndVnode)) {
                // 首-尾
                patch(oldEndVnode, newStartVnode, container)
                // 移动到老节点第一个前面
                insert(newStartVnode.el, container, newStartVnode.el)
                // 更新
                newStartVnode = newChildren[++newStartIdx]
                oldEndVnode = oldChildren[--oldEndIdx]
            }else if(sameVnode(newEndVnode, oldStartVnode)) {
                // 尾-首
                patch(oldStartVnode, newEndVnode, container)
                // 移动
                const nextEl = oldChildren[oldEndIdx+1] ? oldChildren[oldEndIdx+1].el : null
                insert(newEndVnode.el, container, nextEl)
                // 更新
                newEndVnode = newChildren[--newEndIdx]
                oldStartVnode = oldChildren[++oldStartIdx]
            }else {
                // 兜底处理
                let inOldIdx = -1
                for(let i = oldStartIdx; i <= oldEndIdx; i++) {
                    if(!oldChildren[i]) continue
                    if(sameVnode(newStartVnode, oldChildren[i])) {
                        inOldIdx = i
                        break;
                    }
                }
                if(inOldIdx > -1) {
                    const oldChild = oldChildren[inOldIdx]
                    patch(oldChild, newStartVnode, container)
                    insert(newStartVnode.el, container, oldStartVnode.el)
                    oldChildren[inOldIdx] = undefined
                }else{
                    // 插入新的节点
                    patch(null, newStartVnode, container)
                    insert(newStartVnode.el, container, oldStartVnode.el)
                }
                newStartVnode = newChildren[++newStartIdx]
            }
        }

        // 剩余的需要加进去
        while(newStartIdx <= newEndIdx) {
            patch(null, newStartVnode, container)
            insert(newStartVnode.el, container, oldStartVnode ? oldStartVnode.el : null)
            newStartVnode = newChildren[++newStartIdx]
        }

        // 剩余的需要移除
        while(oldStartIdx <= oldEndIdx) {
            if(oldStartVnode) {
                unmount(oldStartVnode)
            }
            oldStartVnode = oldChildren[++oldStartIdx]
        }


    }



    function patchSimpleChildren(n1, n2, container) {
        const oldChildren = n1.children
        const newChildren = n2.children
        const oldLen = oldChildren.length
        const newLen = newChildren.length
        // 建立一个索引，newChildren的 index => oldChildren index
        const marked = new Array(oldLen).fill(false)
        const oldKeyMap = {}
        oldChildren.forEach((c, i) => {
            if (c.key !== undefined) {
                oldKeyMap[c.key] = i
            }
        })

        const indexMap = {}
        let k = -1
        // 建立 newChild 每一项到 oldChildren 的映射
        for (let i = 0; i < newLen; i++) {
            const newChild = newChildren[i]
            if (oldKeyMap[newChild.key]) {
                indexMap[i] = oldKeyMap[newChild.key]
                marked[oldKeyMap[newChild.key]] = true
            } else {
                // 如果映射里面没有，那就从剩余没有映射的里面找一个
                while (++k < oldLen) {
                    if (marked[k]) continue
                    indexMap[i] = k
                    marked[k] = true
                    break
                }
            }
        }
        // 1. 遍历 newChildren，从 oldChildren 中找出对应的映射；patch & 移动
        for (let i = 0; i < newLen; i++) {
            const newChild = newChildren[i]
            let lastIndex = 0
            let founded = false
            let j = 0;
            // 查找到了
            if ((j = indexMap[i]) !== undefined) {
                founded = true
                const oldChild = oldChildren[j]
                patch(oldChild, newChild, container)
                if (j < lastIndex) {
                    const prevNode = children[i - 1]
                    if (prevNode) {
                        const anchor = prevNode.el.nextSlibing
                        insert(newChild.el, container, anchor)
                    }
                } else {
                    lastIndex = j
                }
            }
            // 判断是否查找到
            if (!founded) {
                // 挂载
                patch(null, newChild, container)
                // 移动
                let anchor = null
                const prevNode = newChildren[i - 1]

                if (prevNode) {
                    anchor = prevNode.el.nextSlibing
                } else {
                    anchor = container.firstChild
                }
                insert(newChild.el, container, anchor)
            }
        }
        // 遍历 oldChildren，如果 newChildren 中不存在则移除
        for (let i = 0; i < oldLen; i++) {
            const oldChild = oldChildren[i]
            if (!marked[i]) {
                unmount(oldChild)
            }
        }
    }

    /**
     * 渲染入口
     * @param {Vnode} vnode 
     * @param {Element} container 
     */
    function render(vnode, container) {
        patchCost = 0
        // 1. vnode 判空处理
        if (!vnode) {
            if (container._vnode) {
                unmount(container._vnode)
            }
        } else {
            patch(container._vnode, vnode, container)
        }
        // 2. 挂载
        container._vnode = vnode
    }

    function hydrate() {

    }

    return {
        render,
        hydrate
    }

}