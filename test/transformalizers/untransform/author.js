import R from 'ramda'

export default {
  name: 'author',
  schema: {
    data: {
      type: R.always('author'),
      id: R.compose(R.toString, R.path(['data', 'id'])),
      untransformId: R.compose(Number, R.path(['id'])),
      attributes({ data }) {
        const attributes = R.pick(['firstName', 'lastName'], data)
        return R.isEmpty(attributes) ? undefined : attributes
      },
      untransformAttributes: R.path(['attributes']),
      relationships: {
        books({ data }) {
          const books = R.prop('books', data)
          if (!books) {
            return undefined
          }
          return {
            data: books.map(book => ({
              name: 'book',
              data: book,
              included: false,
            })),
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
              included: false,
            })),
          }
        },
      },
      links({ options, id }) {
        return {
          self: `${options.url}/authors/${id}`,
        }
      },
    },
  },
}
