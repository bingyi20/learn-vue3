

sleep = (timeout=100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

fetchData = (value, timeout) =>{
    return sleep(timeout).then(_ => value)
}


module.exports = {
    sleep,
    fetchData
}