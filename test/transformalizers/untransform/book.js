import R from 'ramda'

export default {
  name: 'book',
  schema: {
    data: {
      type: R.always('book'),
      id: R.compose(R.toString, R.path(['data', 'id'])),
      untransformId: R.compose(Number, R.path(['id'])),
      attributes({ data }) {
        const attributes = R.pick(['title', 'copyright'], data)
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
        reviews({ data }) {
          const reviews = R.prop('reviews', data)
          if (!reviews) {
            return undefined
          }
          return {
            data: reviews.map(review => ({
              name: 'review',
              data: review,
              included: true,
            })),
          }
        },
        publisher({ data }) {
          const publisher = R.prop('publisher', data)
          if (!publisher) {
            return undefined
          }
          return {
            data: {
              name: 'publisher',
              data: publisher,
              included: true,
            },
          }
        },
        tags({ data }) {
          const tags = R.prop('tags', data)
          if (!tags) {
            return undefined
          }
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
          self: `${options.url}/books/${id}`,
        }
      },
    },
  },
}
