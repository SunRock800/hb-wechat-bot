import axios from 'axios'

async function get_conversation_history(account) {
  const conversation_history_config = {
    method: 'get',
    url: 'http://47.242.187.173:8090/v1/messages',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer app-uF3WmqRbMkOwpWonpNRH2JSe',
    },
    params: {
      conversation_id: '4975f9bc-05b5-43a0-92c0-e832d325968c',
      user: '8613361016119@c.us',
      limit: 3,
    },
  }
  const conversation_history = await axios(conversation_history_config)
    .then((response) => {
      return response.data
    })
    .catch((error) => {
      console.log(error)
    })

  return conversation_history
}

const h = await get_conversation_history('8613361016119@c.us')
console.log(h)
