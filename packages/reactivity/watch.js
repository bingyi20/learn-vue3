const { effect, track, trigger } = require('./effect')
const { sleep, fetchData } = require('./utils')
const { queueJob } = require('./scheduler')


const traverse = (value, seen = new WeakSet) => {
    if(!value || typeof value !== 'object' || seen.has(value)) return value
    // 数组等数据类型暂不做处理
    for(const k of Object.keys(value)) {
        // 递归触发 getter
        traverse(value[k], seen)
    }
    return value
}

const watch = (source, cb, options = {}) => {
    let getter = source
    if(typeof source !== 'function') {
        getter = () => traverse(source)
    }

    let oldVal, newVal

    let cleanup = null
    const onInvalidate = (fn) => {
        cleanup = fn
    }

    const job = () => {
        // 先进行清理操作
        if(cleanup) {
            cleanup()
        }
        const newVal = effectFn()
        cb(newVal, oldVal, onInvalidate)
        oldVal = newVal
    }

    const effectFn =  effect(getter, {
        lazy: true,
        scheduler() {
            queueJob(job)
        }
    })

    if(options.immediate) {
        job()
    }else{
        oldVal = effectFn()
    }
}


const data = {firstName: 'fina', lastName: 'fang'}
const obj = new Proxy(data, {
    get(target, key) {
        // 触发依赖收集
        track(target, key)
        return target[key]
    },
    set(target, key, value) {
        target[key] = value
        // 取出依赖执行
        trigger(target, key)
    }
})


const timeouts = [1000, 500]
let idx = 0
let text = ''

watch(() => {
    return obj.firstName + obj.lastName
}, async (newVal, oldVal, onInvalidate) => {

    let expired = false

    onInvalidate(() => {
        expired = true
    })

    const timeout = timeouts[idx]
    idx = idx == 0 ? 1 : 0
    const res = await fetchData(newVal, timeout)
    // 先检测是否过期
    if(!expired) {
        text = res
    }
})


const test = async () => {
    obj.firstName = '佳慧'
    await sleep(10)
    obj.lastName = '方'
    await sleep(3000)
    console.log("最终结果为：", text)
    // 预期：佳慧方
    // 当前：佳慧fang
}

test()