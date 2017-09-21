import R from 'ramda'

export default {
  name: 'review',
  schema: {
    data: {
      type: R.always('review'),
      id: R.compose(R.toString, R.path(['data', 'id'])),
      untransformId: R.compose(Number, R.path(['id'])),
      attributes({ data }) {
        const attributes = R.pick(['title', 'content', 'rating'], data)
        return R.isEmpty(attributes) ? undefined : attributes
      },
      untransformAttributes: R.path(['attributes']),
      relationships: {
        author({ data }) {
          const author = R.prop('author', data)
          if (!author) {
            return undefined
          }
          return {
            data: {
              name: 'author',
              data: author,
              included: true,
            },
          }
        },
      },
      links({ options, id }) {
        return {
          self: `${options.url}/reviews/${id}`,
        }
      },
    },
  },
}
