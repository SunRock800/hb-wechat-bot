import { createClient } from 'redis'

export const redis = await createClient({ url: 'redis://:123456@redis:6379/1' })
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect()
