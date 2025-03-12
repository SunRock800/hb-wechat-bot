import axios from 'axios'

function setConfig() {
  return {
    method: 'post',
    url: `http://47.242.187.173:8090/v1/chat-messages`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer app-LKUp25V7uh6ZW43CMljtNj2l`,
    },
    responseType: 'stream',
    data: JSON.stringify({
      inputs: {},
      query: '你好',
      response_mode: 'streaming',
      user: 'test',
      files: [],
    }),
  }
}

async function reply() {
  const config = setConfig()

  try {
    // 使用 axios 调用接口，并设置 responseType 为 'stream'
    const response = await axios(config)

    // 使用一个 Buffer 数组来收集流式数据
    const chunks = []

    // 监听 data 事件，将接收到的数据块添加到 chunks 数组中
    response.data.on('data', (chunk) => {
      const strChunk = chunk.toString('utf-8')
      if (strChunk.startsWith('data: ')) {
        const data = strChunk.substring(6)
        chunks.push(JSON.parse(data))
      }
    })

    // 返回一个 Promise，当流结束时 resolve
    return new Promise((resolve, reject) => {
      // 监听 end 事件，当流结束时合并所有数据块并返回完整的数据
      response.data.on('end', () => {
        let message = ''
        chunks.forEach((item) => {
          if (item.event == 'message') {
            message += item.answer
          } else if (item.event == 'message_end') {
            console.log('message END')
          }
        })
        resolve(message)
      })

      // 监听 error 事件，以便在发生错误时处理
      response.data.on('error', (err) => {
        reject(err)
      })
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

async function run() {
  const res = await reply()
  console.log('res:', res)
}
run()
