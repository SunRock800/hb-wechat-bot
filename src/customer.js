import axios from 'axios'
import dotenv from 'dotenv'
import moment from 'moment'
import { redis } from './redis.js'

function getKey(account) {
  return 'dify-cid-' + account
}

async function getCustomer(account) {
  // 获取对话id
  const key = getKey(account)
  const customerCache = await redis.get(key)
  let customerObj = { conversation: '', customerId: '' }
  if (customerCache != null) {
    try {
      customerObj = JSON.parse(customerCache)
    } catch (e) {
      customerObj = { conversation: customerCache, customerId: '' }
    }
  }
  if (customerObj.customerId === '' || customerObj.customerId == null)
    customerObj = await setCustomer(account, customerObj.conversation, customerObj.customerId)
  return customerObj
}

async function setCustomer(account, conversation = '', customerId = '') {
  const key = getKey(account)
  if (!customerId || customerId === '' || customerId == null) customerId = await createCustomer(account)
  const customerObj = { conversation: conversation, customerId: customerId }
  redis.set(key, JSON.stringify(customerObj))
  return customerObj
}

function createCustomer(account, is_customer = false, language = '', targetProduct = '') {
  if (targetProduct == '') targetProduct = '暂无'
  const config = {
    method: 'post',
    url: 'http://118.190.210.196:8899/api/customer/insert',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      createDate: moment(new Date()).format('YYYY-MM-DD'), //必填，询盘日期
      language: language, //语言
      mark: 'D', //必填，默认值：D
      source: '1', //默认值：1
      targetProduct: targetProduct,
      whatsapp: account, //必填
      // areaSource: "中国",			//地区
    }),
  }

  console.log('createCustomer config:', config)

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

async function chatRecord1(account) {
  // 客户信息
  const customerObj = await getCustomer(account)
  console.log('chat record customer:', customerObj)

  // 获得对话历史
  dotenv.config()
  const env = dotenv.config().parsed // 环境参数
  const token = env.DIFY_API_KEY
  const url = env.DIFY_URL
  const conversation_history_config = {
    method: 'get',
    url: `${url}/messages`,
    // responseType: 'stream',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    params: {
      conversation_id: customerObj.conversation,
      user: account,
      limit: 999,
    },
  }
  console.log('conversation_history_config', conversation_history_config)
  const conversation_history = await axios(conversation_history_config)
    .then((response) => {
      const result = response.data
      console.log('conversation_history:', result)
    })
    .catch((error) => {})
  return true

  // 提交数据
  /*const config = {
		method: 'post',
		url: 'http://118.190.210.196:8899/api/chatRecord/insert1',
		timeout: 120000,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			customerId: customerObj.customerId, //必传，先保存客户信息返回值
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
		if(result.code == 0){
			return true
		}else{
			console.log('chat record error:', result.msg)
			return false
		}
	})
	.catch((error) => {
		console.error('Error fetching data:', error)
		// throw error;
	})*/
}

async function chatRecord(account, messages) {
  const customerObj = await getCustomer(account)
  console.log('chat record customer:', customerObj)
  const config = {
    method: 'post',
    url: 'http://118.190.210.196:8899/api/chatRecord/insert',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      customerId: customerObj.customerId, //必传，先保存客户信息返回值
      messageList: messages,
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
  createCustomer,
  chatRecord,
}
