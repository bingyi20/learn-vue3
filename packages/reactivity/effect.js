const { sleep } = require('./utils')
const { queueJob } = require('./scheduler')

let activeEffect = null
const effectStack = []
const bucket = new WeakMap()

const cleanup = (effectFn) => {
    const deps = effectFn.deps
    deps.forEach(dep => {
        dep.delete(effectFn)
    })
}
/**
 * 收集副作用
 * @param {Object} target 
 * @param {String} key 
 * @returns 
 */
const track = (target, key) => {
    if(!activeEffect) return 
    // 层层递进，没有就建
    let set = null
    if(!bucket.get(target)) bucket.set(target, new Map())
    if(!bucket.get(target).get(key)) bucket.get(target).set(key, new Set())
    set = bucket.get(target).get(key)
    set.add(activeEffect)
    activeEffect.deps.add(set)
}
/**
 * 触发副作用
 * @param {Object} target 
 * @param {String} key 
 */
const trigger = (target, key) => {
    try{
        const effectSet = bucket.get(target).get(key)
        const runEffect = new Set(effectSet)
        runEffect.delete(activeEffect)
        runEffect.forEach(fn => {
            if(fn.options.scheduler) {
                fn.options.scheduler(fn)
            }else{
                fn()
            }
        });
    }catch(e){}
}


const effect = (fn, options = {}) => {
    const effectFn = () => {
        // 清空该副作用的收集
        cleanup(effectFn)
        // 将当前副作用函数设置为活跃状态
        effectStack.push(activeEffect = effectFn)
        // 执行函数，内部读取值将触发依赖收集
        const res = fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
        return res
    }
    // 记录该副作用函数被那些给收集了
    effectFn.deps = new Set()
    effectFn.options = options
    if(!options.lazy) {
        effectFn()
    }
    return effectFn
}

module.exports =  {
    effect,
    track,
    trigger
}

// const data = {text1: 'finafang', text2: 'crystal'}
// const obj = new Proxy(data, {
//     get(target, key) {
//         // 触发依赖收集
//         track(target, key)
//         return target[key]
//     },
//     set(target, key, value) {
//         target[key] = value
//         // 取出依赖执行
//         trigger(target, key)
//     }
// })

// ========= API调用区 ============

// console.log("【初始化】")
// effect(() => {
//     console.log(obj.text1)
//     console.log(obj.text2)
// }, {
//     scheduler(job) {
//         queueJob(job)
//     }
// })

// const test = async () => {
//     console.log("【开始变更】")
//     obj.text1 = '方佳慧'
//     obj.text2 = '刘亦菲'
// }

// test()