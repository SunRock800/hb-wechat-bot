import axios from 'axios'
import dotenv from 'dotenv'
import { customer } from '../customer.js'

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
  const customerObj = await customer.getCustomer(fromName)
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
      user: fromName,
      conversation_id: '' + customerObj.conversation,
      files: [],
    }),
  }
}

export async function getDifyReply(prompt, fromName) {
  try {
    // 保留用户消息
    if (prompt != '') {
      customer.chatRecord(fromName, 1, prompt)
    } else {
      prompt = ' '
    }

    const config = await setConfig(prompt, fromName)

    console.log('🌸🌸🌸 / config: ', config)
    console.log('🌸🌸🌸 / fromName: ', fromName)

    const response = await axios(config)

    let result = ''
    let customerObj = await customer.getCustomer(fromName)
    const lines = response.data.split('\n').filter((line) => line.trim() !== '')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const messageObj = JSON.parse(line.substring(6))
        // console.log(messageObj)
        if (customerObj.conversation == '') customerObj.conversation = messageObj.conversation_id
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

    // 保留回复消息
    customer.chatRecord(fromName, 0, result)

    // 客户信息缓存
    await customer.setCustomer(fromName, customerObj.conversation, customerObj.customerId)

    return result
  } catch (error) {
    console.error(error.code)
    console.error(error.message)
  }
}
