let promiseTemp = null
let promiseResolve = null
function loginFinish() {
  return promiseTemp
}

async function func1() {
  let temp = new Promise((res, rej) => {
    setTimeout(() => {
      console.log('第三')
      promiseResolve('我执行完了，轮到第四了')
    }, 2000)
  })

  promiseTemp = new Promise((resolve) => (promiseResolve = resolve))
  let a = await loginFinish()
  console.log(a)
}
function func2() {
  console.log('第二')
  func1()
}
function func3() {
  console.log('第一')
  func2()
  console.log('第四')
}
func3()
