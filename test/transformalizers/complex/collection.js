import R from 'ramda'

export default {
  name: 'collection',
  schema: {
    data: {
      type: R.always('collection'),
      id: R.path(['data', 'id']),
      attributes({ data }) {
        return R.pickAll(['name', 'desc'], data)
      },
      relationships: {
        content({ data }) {
          const content = R.propOr([], 'content', data)
          return {
            data: content.map(c => ({
              name: c._type,
              data: c,
              included: true,
            })),
          }
        },
        tags({ data }) {
          const tags = R.propOr([], 'tags', data)
          return {
            data: tags.map(tag => ({
              name: 'tag',
              data: tag,
              included: true,
            })),
          }
        },
      },
      links({ options, id }) {
        return {
          self: `${options.url}/collections/${id}`,
        }
      },
    },
  },
}
