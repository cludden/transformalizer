import Serializer from '../../../lib/serializer'
import article from './article'
import person from './person'

const options = { baseUrl: 'https://api.example.com' }

const serializer = new Serializer(options)

serializer.register(article)
serializer.register(person)

export default serializer

export { article, options, person }
