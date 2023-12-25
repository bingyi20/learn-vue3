# 渲染器

## 渲染器设计

#### 基础渲染
ADT
1. createRenderer(options)
返回渲染器
options: dom 操作 api，外部传入，与平台解耦
    - insert(el, parent, anchor)： 将节点 el 插入到 parent 的 anchor 的前面，如果插在最后面，不传anchor即可
    - creatElement(tag): 创建特定类型的节点
    - setElementText(el, text): 为特定元素设置节点

2. render(vnode, container)
真实的渲染函数
vnode：将要执行渲染的虚拟 DOM
container: 虚拟 dom 挂载点

3. mountElement(vnode, container)
挂载 vnode 到 container 上


4. patch(n1, n2, container)
打补丁
n1: 新的虚拟dom
n2: 老的虚拟dom
container: 父容器节点


#### 属性挂载
```js
props: {
    id: '123',
    class: 'red',
    style: 'font-size: 15px'
}
```











#### 事件

#### 更新

#### 文本节点与注释节点

#### Fragment 