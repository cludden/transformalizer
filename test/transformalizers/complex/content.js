
export default {
  name: 'content',
  schema: {
    data: {
      dataSchema({ data }) {
        return data._type
      },
    },
    links({ options }) {
      return {
        self: `${options.url}/collections/${options.collection.id}/content`,
      }
    },
    meta({ source }) {
      return {
        count: source.length,
      }
    },
  },
}
