import R from 'ramda'

export default {
  name: 'article',
  schema: {
    data: {
      type: R.always('article'),
      id: R.path(['data', 'id']),
      attributes({ data }) {
        return R.pickAll(['title', 'body'], data)
      },
      relationships: {
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
          self: `${options.url}/articles/${id}`,
        }
      },
    },
  },
}
