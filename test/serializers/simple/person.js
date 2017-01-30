import R from 'ramda'

import { topLevelLinks, topLevelMeta } from './common'

const schema = {
  type: 'person',
  options: {
    basePath: 'content/people',
  },
  schema: {
    id({ data, options }) { // eslint-disable-line
      return R.prop('_id', data)
    },

    type: R.always('person'),

    attributes({ data, input, options }) { // eslint-disable-line
      const source = R.propOr({}, '_source', data)

      return R.applySpec({
        first: R.pipe(R.prop('name'), R.split, R.head, R.toLower),
        last: R.pipe(R.prop('name'), R.split, R.tail, R.toLower),
        name: R.prop('name', R.toLower),
      })(source)
    },

    relationships: {
      images({ attributes, data, id, included, input, options }) { // eslint-disable-line
        const images = R.path(['_source', 'images'], data)
        const rel = {
          links: {
            self: `${options.baseUrl}/${options.basePath}/${id}/relationships/people`,
            related: `${options.baseUrl}/${options.basePath}/${id}/people`,
          },
        }
        if (Array.isArray(images) && images.length) {
          rel.data = images.map(({ id: imageId, types }) => ({
            type: 'image',
            id: imageId,
            meta: { types },
          }))
        }
        return rel
      },
    },

    topLevelLinks,

    topLevelMeta,
  },
}

export default schema
