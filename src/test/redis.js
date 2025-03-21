import { redis } from '../redis.js'
const value = { cid: '123', customerId: '321' }
redis.set('test', JSON.stringify(value))
// redis.set('test', '123')

const valueStr = await redis.get('test')
const valueObj = JSON.parse(valueStr)
console.log(valueObj)
console.log(typeof valueObj)

redis.disconnect()
