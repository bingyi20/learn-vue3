

const jobs = new Set()
let flushing =  false



const flushingJob = () => {
    jobs.forEach(task => {
        task()
    })
    // 执行完成之后就要清空啊
    jobs.clear()
    flushing = false
}

const p = Promise.resolve('')

exports.queueJob = (job) => {
    jobs.add(job)
    if(flushing) return
    flushing = true
    p.then(flushingJob)
}