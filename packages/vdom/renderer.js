const createRender = (options) => {

    const {insert, createElement, setElementText} = options

    /**
     * 渲染器
     * @param {Vnode} vnode 
     * @param {Element} container 
     */
    const render = (vnode, container) => {
        patch(vnode, container._vnode, container)
        container._vnode = vnode
    }

    /**
     * 卸载指定节点
     * @param {Element} container 需要卸载的节点
     */
    const unmountElement = (container) => {
        container.innerHTML = ''
    }

    /**
     * 
     * @param {Object} vnode 虚拟 dom
     * @param {Element} container 真实 dom 节点
     */
    const mountElement = (vnode, container) => {
        // 1. 基于 vnode 类型创建节点 el
        const el  = createElement(vnode.type)
        // 2. 判断其 children 
        if(typeof vnode.children === 'string') {
            //  3. 如果是字符串：直接给 el 复制文本信息
            setElementText(el, vnode.children)
        }else{
            //  4. 如果是数组：调用 mountElement 递归创建子节点， el 为父节点
            vnode.children.forEach(child => {
                patch(child, null, el)
            });
        }
        // 5. 将 el 插入 container
        insert(el, container)
    }

    /**
     * 打补丁
     * @param {Vnode} n1 新的虚拟节点
     * @param {Vnode} n2 老的虚拟节点
     * @param {Element} container 父容器节点
     */
    const patch = (n1, n2, container) => {
        if(!n1) {
            unmountElement(container)
        }else if(!n2) {
            mountElement(n1, container)
        }else{
            // TODO: 需要做 diff 比对了
            patchElement(n1, n2, container)
        }
    }

    return {
        render
    }
}