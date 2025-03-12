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
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      // Accept: 'application/json',
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
    const res = await axios.post(config)
    let result = ''
    const lines = res.data.split('\n').filter((line) => line.trim() !== '')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const messageObj = line.substring(6)
        if (messageObj === '[DONE]') break
        const message = JSON.parse(messageObj)
        if (message.choices && message.choices[0].delta && message.choices[0].delta.content) {
          result += message.choices[0].delta.content
        }
      }
    }
    return result

    // const response = await axios(config)
    // console.log('🌸🌸🌸 / response: ', response)
    // return response
  } catch (error) {
    console.error(error.code)
    console.error(error.message)
  }
}
