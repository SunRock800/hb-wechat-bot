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
    // responseType: 'stream',
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

    let result = ''
    const lines = response.data.split('\n').filter((line) => line.trim() !== '')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const messageObj = JSON.parse(line.substring(6))
        switch (messageObj.event) {
          case 'message':
            result += messageObj.answer
            break
          case 'workflow_finished':
            result = messageObj.data.outputs.answer
            break
        }
      }
    }
    return result
  } catch (error) {
    console.error(error.code)
    console.error(error.message)
  }
}
