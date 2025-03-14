import axios from 'axios'

function setConfig() {
  return {
    method: 'post',
    url: 'http://47.242.187.173:8090/v1/chat-messages',
    // responseType: 'stream',
    headers: {
      'Content-Type': 'application/json',
      // Accept: 'application/json',
      Authorization: `Bearer app-kWJc7LAiT7bkDB2X5cdIOQfD`,
    },
    data: JSON.stringify({
      inputs: {},
      query: '你好',
      response_mode: 'streaming',
      user: 'test',
      files: [],
    }),
  }
}

async function reply1() {
  const config = setConfig()
  let message = ''
  await axios(config, {}).then((response) => {
    const stream = response.data

    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n')
      lines.forEach((line) => {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5))
          // console.log('Received SSE event:', data);
          if (data.event == 'workflow_finished') {
            message += data.data.outputs.answer
          }
        }
      })
    })

    stream.on('end', () => {
      console.log('Stream ended')
    })

    stream.on('error', (err) => {
      console.error('Stream error:', err)
    })
  })
  console.log(message)
  return message
}

async function reply() {
  const config = setConfig()

  try {
    const res = await axios(config)

    let result = ''
    const lines = res.data.split('\n').filter((line) => line.trim() !== '')
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
    console.error('Error fetching data:', error)
    throw error
  }
}

async function run() {
  const res = await reply()
  console.log('res:', res)
}
run()
