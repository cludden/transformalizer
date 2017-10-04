import R from 'ramda'

export default {
  name: 'series',
  schema: {
    data: {
      type: R.always('series'),
      id: R.compose(R.toString, R.path(['data', 'id'])),
      untransformId: R.compose(Number, R.path(['id'])),
      attributes({ data }) {
        const attributes = R.pick(['title'], data)
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
              included: true,
            })),
          }
        },
      },
      links({ options, id }) {
        return {
          self: `${options.url}/series/${id}`,
        }
      },
    },
  },
}
