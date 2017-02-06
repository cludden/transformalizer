import createTransformalizer from '../../../lib/transformalizer'
import article from './article'
import person from './person'

const options = { baseUrl: 'https://api.example.com' }

const transformalizer = createTransformalizer(options)

transformalizer.register(article)
transformalizer.register(person)

export default transformalizer

export { article, options, person }
