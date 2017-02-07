import createTransformalizer from '../../../lib/transformalizer'
import article from './article'
import collection from './collection'
import tag from './tag'
import video from './video'

const options = { url: 'https://api.example.com' }

const transformalizer = createTransformalizer(options)
transformalizer.register(article)
transformalizer.register(collection)
transformalizer.register(tag)
transformalizer.register(video)

export default transformalizer
