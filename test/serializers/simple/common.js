import qs from 'qs'
import R from 'ramda'

export function determineLanguage({ language, languageAvailability, primaryLanguage }) {
  if (R.isString(language) && languageAvailability.indexOf(language) !== -1) {
    return language
  }
  if (R.is(String, primaryLanguage) || languageAvailability.indexOf(primaryLanguage) !== -1) {
    return primaryLanguage
  }
  return undefined
}

export function topLevelLinks({ input, options }) {
  if (!Array.isArray(input)) {
    return undefined
  }
  const query = R.merge({ page: { size: 20, number: 1 } }, R.propOr('query', options))
  const nextQuery = R.assocPath(['page', 'number'], query.page.number + 1, query)
  return {
    self: `${options.baseUrl}/${options.basePath}?${qs.stringify(query)}`,
    next: `${options.baseUrl}/${options.basePath}?${qs.stringify(nextQuery)}`,
  }
}

export function topLevelMeta({ input, options }) { // eslint-disable-line
  const aggs = R.prop('aggs', options)
  if (!aggs) {
    return undefined
  }
  return { facets: aggs }
}
