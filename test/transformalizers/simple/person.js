import R from 'ramda'

import { links, meta } from './common'

const schema = {
  name: 'person',
  schema: {
    data: {
      id({ source, options, data }) { // eslint-disable-line
        return R.prop('_id', data)
      },

      type({ source, options, data }) { // eslint-disable-line
        return 'person'
      },

      attributes({ data, input, options }) { // eslint-disable-line
        const [first, last] = R.pipe(
          R.pathOr('', ['_source', 'name']),
          name => name.split(' '),
        )(data)
        return {
          first,
          last,
        }
      },
    },

    links,

    meta,
  },
}

export default schema
