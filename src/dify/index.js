import axios from 'axios'
import dotenv from 'dotenv'
// 加载环境变量
dotenv.config()
const env = dotenv.config().parsed // 环境参数
const token = env.DIFY_API_KEY
const url = env.DIFY_URL
const bot_name = env.BOT_NAME
const actions = {
  chat: 'chat-messages',
  work: 'workflow/run',
}
function getAction() {
  return actions[env.DIFY_ACTION]
}
function setConfig(prompt) {
  const action = getAction()
  return {
    method: 'post',
    url: `${url}/${action}`,
    responseType: 'stream',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify({
      inputs: {},
      query: prompt,
      response_mode: 'streaming',
      user: bot_name,
      files: [],
    }),
  }
}

export async function getDifyReply(prompt) {
  try {
    const config = setConfig(prompt)
    console.log('🌸🌸🌸 / config: ', config)
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
    console.error(error.code)
    console.error(error.message)
  }
}
