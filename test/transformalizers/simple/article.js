import R from 'ramda'

import { determineLanguage, links, meta } from './common'

const article = {
  name: 'article',
  options: {
    basePath: '/content/articles',
  },
  schema: {
    data: {
      type: R.always('article'),

      id({ source, options, data }) { // eslint-disable-line
        return R.prop('_id', data)
      },

      attributes({ source, options, data, id }) { // eslint-disable-line
        const src = R.propOr({}, '_source', data)
        const languageAvailability = R.propOr([], 'languageAvailability', src)
        const primaryLanguage = R.prop('primaryLanguage', src)
        options.language = determineLanguage({
          language: options.language,
          languageAvailability,
          primaryLanguage,
        })
        // define spec with universal attributes
        const spec = {
          createdAt: R.prop('createdAt'),
          primaryLanguage,
        }
        // if a language is available, add it to the spec
        if (options.language) {
          spec.alternateTitle = R.prop(`alternateTitle_${options.language}`)
          spec.title = R.prop(`title_${options.language}`)
        }
        return R.applySpec(spec)(src)
      },

      relationships: {
        people({ source, options, data, id, attributes, include }) { // eslint-disable-line
          const people = R.path(['_source', 'people'], data)
          const result = {
            links: {
              self: `${options.baseUrl}/${options.basePath}/${id}/relationships/people`,
              related: `${options.baseUrl}/${options.basePath}/${id}/people`,
            },
          }
          if (Array.isArray(people) && people.length) {
            result.data = people.map((person) => {
              const { name, roles } = person
              if (name) {
                include('person', {
                  _id: person.id,
                  _source: person,
                })
              }
              return {
                name: 'person',
                data: {
                  _id: person.id,
                  _source: person,
                },
                meta: { roles },
              }
            })
          }
          return result
        },
      },

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
    },

    links,

    meta,
  },
}

export default article
