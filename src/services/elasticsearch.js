const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
  apiVersion: '8.11',
});
const MESSAGE_INDEX = 'messages';

// Index otomatik oluşturucu
async function ensureMessageIndex() {
  const exists = await esClient.indices.exists({ index: MESSAGE_INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: MESSAGE_INDEX,
      body: {
        mappings: {
          properties: {
            content: { type: 'text' },
            sender: { type: 'keyword' },
            receiver: { type: 'keyword' },
            conversation: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
    console.log('[Elastic] messages index created');
  } else {
    console.log('[Elastic] messages index already exists');
  }
}

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
  ensureMessageIndex,
  indexMessage,
  searchMessages,
};
