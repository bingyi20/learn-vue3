
const {effect, track, trigger} = require('./effect')
const { sleep } = require('./utils')
const {queueJob} = require('./scheduler')


const computed = (getter) => {

    let _value
    let dirty = true

    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true
            // 需要手动触发副作用执行
            trigger(obj, 'value')
        }
    })

    const obj = {
        get value() {
            track(obj, 'value')
            // 需要手动进行副作用收集
            if(dirty) {
                dirty = false
                _value = effectFn()
            }
            return _value
        }
    }

    return obj
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

const fullName = computed(() => {
    return obj.firstName + ' ' + obj.lastName
})

effect(() => {
    console.log("I am " + fullName.value)
}, {
    scheduler(job) {
        queueJob(job)
    }
})

const test = async () => {
    obj.firstName = '佳惠'

    // await sleep(500)

    obj.lastName = '方'
}

test()