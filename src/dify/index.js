import axios from 'axios'
import dotenv from 'dotenv'
import { redis } from '../redis.js'
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
async function setConfig(prompt, fromName) {
  const action = getAction()
  const cid = await getCid(fromName)
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
      conversation_id: '' + cid,
      files: [],
    }),
  }
}

async function getCid(fromName) {
  // 获取对话id
  const ckey = 'dify-cid-' + fromName
  let cid = await redis.get(ckey)
  if (cid == null) cid = ''
  return cid
}

export async function getDifyReply(prompt, fromName) {
  try {
    const config = await setConfig(prompt, fromName)

    console.log('🌸🌸🌸 / config: ', config)
    console.log('🌸🌸🌸 / fromName: ', fromName)

    const response = await axios(config)

    let result = ''
    let cid = await getCid(fromName)
    const ckey = 'dify-cid-' + fromName
    const lines = response.data.split('\n').filter((line) => line.trim() !== '')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const messageObj = JSON.parse(line.substring(6))
        console.log(messageObj)
        if (cid == '') cid = messageObj.conversation_id
        switch (messageObj.event) {
          case 'message':
            result += messageObj.answer
            break
          case 'workflow_finished':
            result = messageObj.data.outputs.answer
            break
          case 'agent_thought':
            result = messageObj.thought
            break
        }
      }
    }
    await redis.set(ckey, cid)

    return result
  } catch (error) {
    console.error(error.code)
    console.error(error.message)
  }
}
