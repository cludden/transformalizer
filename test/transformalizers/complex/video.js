import R from 'ramda'

export default {
  name: 'video',
  schema: {
    data: {
      type: R.always('video'),
      id: R.path(['data', 'id']),
      attributes({ data }) {
        return R.pickAll(['name', 'description'], data)
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
          self: `${options.url}/videos/${id}`,
        }
      },
    },
  },
}
