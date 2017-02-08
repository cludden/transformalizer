import createTransformalizer from '../../../lib/transformalizer'
import article from './article'
import collection from './collection'
import content from './content'
import tag from './tag'
import video from './video'

const options = { url: 'https://api.example.com' }

const transformalizer = createTransformalizer(options)
transformalizer.register(article)
transformalizer.register(collection)
transformalizer.register(content)
transformalizer.register(tag)
transformalizer.register(video)

export default transformalizer
