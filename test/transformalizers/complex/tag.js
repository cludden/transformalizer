import R from 'ramda'

export default {
  name: 'tag',
  schema: {
    data: {
      type: R.always('tag'),
      id: R.path(['data', 'id']),
      attributes({ data }) {
        return R.pickAll(['name', 'desc'], data)
      },
      links({ options, id }) {
        return {
          self: `${options.url}/tags/${id}`,
        }
      },
    },
  },
}
