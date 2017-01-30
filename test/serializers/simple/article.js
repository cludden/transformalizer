import R from 'ramda'

import { determineLanguage, topLevelLinks, topLevelMeta } from './common'

const article = {
  type: 'article',
  options: {
    basePath: 'content/articles',
  },
  schema: {
    id({ data, options }) { // eslint-disable-line
      return R.prop('_id', data)
    },

    type: R.always('article'),

    links({ attributes, data, id, input, options, relationships, type }) { // eslint-disable-line
      return {
        self: `${options.baseUrl}/${options.basePath}/${id}${options.language ? `?language=${options.language}` : ''}`,
      }
    },

    meta({ attributes, data, id, input, options, relationships, type }) { // eslint-disable-line
      if (options.language) {
        return { language: options.language }
      }
      return undefined
    },

    attributes({ data, input, options }) { // eslint-disable-line
      const source = R.propOr({}, '_source', data)
      const languageAvailability = R.propOr([], 'languageAvailability', source)
      const primaryLanguage = R.prop('primaryLanguage', source)
      const language = options.language = determineLanguage({
        language: options.language,
        languageAvailability,
        primaryLanguage,
      })
      const spec = {
        createdAt: R.prop('createdAt'),
        primaryLanguage,
      }
      if (language) {
        spec.alternateTitle = R.prop(`alternateTitle_${language}`)
        spec.title = R.prop(`title_${language}`)
      }
      return R.applySpec(spec)(source)
    },

    relationships: {
      people({ attributes, data, id, included, input, options }) { // eslint-disable-line
        const people = R.path(['_source', 'people'], data)
        const rel = {
          links: {
            self: `${options.baseUrl}/${options.basePath}/${id}/relationships/people`,
            related: `${options.baseUrl}/${options.basePath}/${id}/people`,
          },
        }
        if (Array.isArray(people) && people.length) {
          rel.data = people.map((person) => {
            if (person.name) {
              included.add('person', {
                _id: person.id,
                _source: person,
              })
            }
            return {
              type: 'person',
              id: person.id,
              meta: { roles: person.roles },
            }
          })
        }
        return rel
      },
    },

    topLevelLinks,

    topLevelMeta,
  },
}

export default article
