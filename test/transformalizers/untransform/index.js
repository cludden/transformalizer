import createTransformalizer from '../../../lib/transformalizer'
import author from './author'
import book from './book'
import publisher from './publisher'
import review from './review'
import series from './series'
import tag from './tag'

const options = { url: 'https://api.example.com' }

const transformalizer = createTransformalizer(options)
transformalizer.register(author)
transformalizer.register(book)
transformalizer.register(publisher)
transformalizer.register(review)
transformalizer.register(series)
transformalizer.register(tag)

export default transformalizer
