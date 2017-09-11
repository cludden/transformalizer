import R from 'ramda'

export default {
  name: 'publisher',
  schema: {
    data: {
      type: R.always('publisher'),
      id: R.compose(R.toString, R.path(['data', 'id'])),
      untransformId: R.compose(Number, R.path(['id'])),
      attributes({ data }) {
        const attributes = R.pick(['name'], data)
        return R.isEmpty(attributes) ? undefined : attributes
      },
      untransformAttributes: R.path(['attributes']),
      links({ options, id }) {
        return {
          self: `${options.url}/publishers/${id}`,
        }
      },
    },
  },
}
