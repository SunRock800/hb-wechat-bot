import axios from 'axios'
import moment from 'moment'
import { redis } from './redis.js'

function getKey(account) {
  return 'dify-cid-' + account
}

async function getCustomer(account) {
  // 获取对话id
  const key = getKey(account)
  const customerCache = await redis.get(key)
  let customer = { conversation: '', customerId: '' }
  if (typeof customerCache == 'object') {
    let customer = JSON.parse(customerCache)
  } else if (typeof customerCache == 'string') {
    let customer = { conversation: customerCache, customerId: '' }
  }
  if (customer.customerId === '' || customer.customerId == null) customer = await setCustomer(account, customer.conversation, customer.customerId)
  return customer
}

async function setCustomer(account, conversation = '', customerId = '') {
  const key = getKey(account)
  if (!customerId || customerId === '' || customerId == null) customerId = await createCustomer(account)
  const customer = { conversation: conversation, customerId: customerId }
  redis.set(key, JSON.stringify(customer))
  return customer
}

function createCustomer(account) {
  const config = {
    method: 'post',
    url: 'http://118.190.210.196:8899/api/customer/insert',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      createDate: moment(new Date()).format('YYYY-MM-DD'), //必填，询盘日期
      // language: "英语",				//语言
      mark: 'D', //必填，默认值：D
      source: '1', //默认值：1
      targetProduct: '目标产品',
      whatsapp: account, //必填
      // areaSource: "中国",			//地区
    }),
  }

  return axios(config)
    .then((response) => {
      const result = response.data
      console.log(result)
      if (result.code == 0) {
        const customerId = result.data.customerId
        console.log('create customer:' + customerId)
        return customerId
      } else {
        console.log('Create customer error:', result.msg)
        return ''
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error)
      throw error
    })
}

async function chatRecord(account, sender, message) {
  const customer = await getCustomer(account)
  console.log('chat record customer:', customer)
  const config = {
    method: 'post',
    url: 'http://118.190.210.196:8899/api/chatRecord/insert',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      customerId: customer.customerId, //必传，先保存客户信息返回值
      messageList: [
        //信息内容
        {
          sender: sender, //0: AI自动回复信息，1：客户发送的聊天信息
          message: message,
          sendTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'), //yyyy-MM-dd HH:mm:ss或者时间戳，统一即可
        },
      ],
    }),
  }
  console.log('chat record config:', config)

  return axios(config)
    .then((response) => {
      const result = response.data
      console.log('chat record:', result)
      if (result.code == 0) {
        return true
      } else {
        console.log('chat record error:', result.msg)
        return false
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error)
      // throw error;
    })
}

export const customer = {
  getCustomer,
  setCustomer,
  chatRecord,
}
