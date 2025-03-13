import axios from 'axios'

function setConfig() {
  return {
    method: 'post',
    url: 'http://47.242.187.173:8090/v1/chat-messages',
    responseType: 'stream',
    headers: {
      'Content-Type': 'application/json',
      // Accept: 'application/json',
      Authorization: `Bearer app-kWJc7LAiT7bkDB2X5cdIOQfD`,
    },
    data: JSON.stringify({
      inputs: {},
      query: '你好',
      response_mode: 'streaming',
      user: 'test',
      files: [],
    }),
  }
}

async function reply1() {
  const config = setConfig()
  let message = ''
  await axios(config, {}).then((response) => {
    const stream = response.data

    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n')
      lines.forEach((line) => {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5))
          // console.log('Received SSE event:', data);
          if (data.event == 'workflow_finished') {
            message += data.data.outputs.answer
          }
        }
      })
    })

    stream.on('end', () => {
      console.log('Stream ended')
    })

    stream.on('error', (err) => {
      console.error('Stream error:', err)
    })
  })
  console.log(message)
  return message
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
        // console.log(data)
        chunks.push(JSON.parse(data))
      } else {
        console.log('nodata:', strChunk)
      }
    })

    // 返回一个 Promise，当流结束时 resolve
    return new Promise((resolve, reject) => {
      // 监听 end 事件，当流结束时合并所有数据块并返回完整的数据
      response.data.on('end', () => {
        let message = ''
        chunks.forEach((item) => {
          switch (item.event) {
            case 'message':
              console.log('message:', item)
              break
            case 'workflow_finished':
              console.log('workflow_finished:', item)
              break
            case 'message_end':
              console.log('Message END')
              break
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
