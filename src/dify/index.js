import axios from 'axios'
import dotenv from 'dotenv'
import { customer } from '../customer.js'
import moment from 'moment/moment.js'
import { createClient } from 'redis'
import { is_buffer } from 'openai/internal/qs/utils'

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

    const resultObj = JSON.parse(result)
    console.log('🌸🌸🌸 / resultObj:', resultObj)
    if (resultObj.is_customer === 'True' || resultObj.is_customer === 'true' || resultObj.is_customer === true) {
      await customer.createCustomer(fromName, true, resultObj.language, resultObj.product)
    }

    // 保留回复消息
    const sendTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    const messages = [
      {
        sender: 1, //0: AI自动回复信息，1：客户发送的聊天信息
        message: prompt,
        sendTime: sendTime, //yyyy-MM-dd HH:mm:ss或者时间戳，统一即可
      },
      {
        sender: 0, //0: AI自动回复信息，1：客户发送的聊天信息
        message: resultObj.message,
        sendTime: sendTime, //yyyy-MM-dd HH:mm:ss或者时间戳，统一即可
      },
    ]
    await customer.chatRecord(fromName, messages)

    // 客户信息缓存
    await customer.setCustomer(fromName, customerObj.conversation, customerObj.customerId)

    return resultObj.message
  } catch (error) {
    console.error(error.code)
    console.error(error.message)
  }
}
