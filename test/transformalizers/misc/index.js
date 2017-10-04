import createTransformalizer from '../../../lib/transformalizer'
import author from './author'
import book from './book'
import publisher from './publisher'
import series from './series'

const options = { url: 'https://api.example.com' }

const transformalizer = createTransformalizer(options)
transformalizer.register(author)
transformalizer.register(book)
transformalizer.register(publisher)
transformalizer.register(series)

export default transformalizer
