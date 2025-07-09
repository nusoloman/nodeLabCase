const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
});
const MESSAGE_INDEX = 'messages';

async function indexMessage(message) {
  await esClient.index({
    index: MESSAGE_INDEX,
    id: message._id.toString(),
    document: {
      content: message.content,
      sender: message.sender.toString(),
      receiver: message.receiver.toString(),
      conversation: message.conversation.toString(),
      createdAt: message.createdAt,
    },
  });
}

async function searchMessages(query) {
  const { hits } = await esClient.search({
    index: MESSAGE_INDEX,
    query: {
      match: { content: query },
    },
  });
  return hits.hits.map((hit) => ({ id: hit._id, ...hit._source }));
}

module.exports = {
  esClient,
  indexMessage,
  searchMessages,
  MESSAGE_INDEX,
};
