import { expect } from 'chai'
import _ from 'lodash'
import { describe, it } from 'mocha'

import transformalizer from '../transformalizers/untransform'

const tags = [
  { id: 501, name: 'kids', description: 'Intended for kids' },
  { id: 502, name: 'fantasy', description: 'Fantasy' },
  { id: 503, name: 'magic', description: 'Contains magic/magical effects' },
  { id: 504, name: 'school', description: 'Set in an educational environment' },
]

const authors = [
  { id: 401, firstName: 'J. R. R.', lastName: 'Tolkien' },
  { id: 402, firstName: 'C.S.', lastName: 'Lewis' },
  { id: 403, firstName: 'J. K.', lastName: 'Rowling' },
  { id: 404, firstName: 'Ernest', lastName: 'Hemingway' },
  { id: 405, firstName: 'John', lastName: 'Steinbeck' },
  { id: 406, firstName: 'Mark', lastName: 'Twain' },
]

const reviews = [
  { id: 301, title: 'Immersive!', content: 'An epic of epic proprotions', rating: 5, author: authors[3] },
  { id: 302, title: 'Very long and boring', content: 'Did you really need to describe every inch of the landscape?', rating: 2, author: authors[5] },
  { id: 303, title: 'Good, but...', content: 'Not enough epic poems', rating: 3, author: authors[4] },
]

const publishers = [
  { id: 201, name: 'Allen & Unwin' },
  { id: 202, name: 'HarperCollins' },
  { id: 203, name: 'Bloomsbury Publishing' },
]

const books = [
  { id: 101, title: 'The Fellowship of the Ring', copyright: 1954, author: authors[0], reviews: _.slice(reviews, 0, 2), publisher: publishers[0], tags: [tags[1], tags[2]] },
  { id: 102, title: 'The Two Towers', copyright: 1954, author: authors[0], reviews: [], publisher: publishers[0], tags: [tags[1], tags[2]] },
  { id: 103, title: 'The Return of the King', copyright: 1955, author: authors[0], reviews: [], publisher: publishers[0], tags: [tags[1], tags[2]] },
  { id: 104, title: 'The Magician\'s Nephew', copyright: 1955, author: authors[1], reviews: [{ id: 4 }, { id: 5 }], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 105, title: 'The Lion, the Witch and the Wardrobe', copyright: 1950, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 106, title: 'The Horse and His Boy', copyright: 1954, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 107, title: 'Prince Caspian: The Return to Narnia', copyright: 1951, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 108, title: 'The Voyage of the Dawn Treader', copyright: 1952, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 109, title: 'The Silver Chair', copyright: 1953, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 110, title: 'The Last Battle', copyright: 1956, author: authors[1], reviews: [], publisher: publishers[1], tags: [tags[0], tags[1], tags[3]] },
  { id: 111, title: 'Harry Potter and the Philosopher\'s Stone', copyright: 1997, author: authors[2], reviews: [reviews[2]], publisher: publishers[2], tags },
  { id: 112, title: 'Harry Potter and the Chamber of Secrets', copyright: 1998, author: authors[2], reviews: [], publisher: publishers[2], tags },
  { id: 113, title: 'Harry Potter and the Prisoner of Azkaban', copyright: 1999, author: authors[2], reviews: [], publisher: publishers[2], tags },
  { id: 114, title: 'Harry Potter and the Goblet of Fire', copyright: 2000, author: authors[2], reviews: [], publisher: publishers[2], tags },
  { id: 115, title: 'Harry Potter and the Order of the Phoenix', copyright: 2003, author: authors[2], reviews: [], publisher: publishers[2], tags },
  { id: 116, title: 'Harry Potter and the Half-Blood Prince', copyright: 2005, author: authors[2], reviews: [], publisher: publishers[2], tags },
  { id: 117, title: 'Harry Potter and the Deathly Hallows', copyright: 2007, author: authors[2], reviews: [{ id: 6 }], publisher: publishers[2], tags },
]

authors[0].books = _.slice(books, 0, 3)
authors[1].books = _.slice(books, 3, 10)
authors[2].books = _.slice(books, 10, 17)
authors[3].reviews = [reviews[0]]
authors[4].reviews = [reviews[2]]
authors[5].reviews = [reviews[1]]

const series = [
  { id: 1, title: 'Lord of the Rings', books: _.slice(books, 0, 3) },
  { id: 2, title: 'The Chronicles of Narnia', books: _.slice(books, 3, 10) },
  { id: 3, title: 'Harry Potter', books: _.slice(books, 10, 17) },
]

describe('untransform', function () {
  it('single primary data only', function () {
    const payload = transformalizer.transform({ name: 'series', source: series[0], options: {} })
    const data = transformalizer.untransform({ document: payload })

    expect(data).to.have.all.keys('series')

    expect(data.series).to.be.an('array').with.lengthOf(1)
    expect(data.series[0]).to.have.property('id', series[0].id)
    expect(data.series[0]).to.have.property('title', series[0].title)
    expect(data.series[0]).to.have.property('books')
    expect(data.series[0].books).to.be.an('array').with.lengthOf(series[0].books.length)
    expect(data.series[0].books).to.have.deep.members(series[0].books.map(book => ({ id: book.id })))
  })

  it('single primary data and included data', function () {
    const payload = transformalizer.transform({ name: 'series', source: series[2] })
    const data = transformalizer.untransform({ document: payload, options: { untransformIncluded: true } })

    expect(data).to.have.all.keys('series', 'book', 'tag', 'author', 'review', 'publisher')

    expect(data.series).to.be.an('array').with.lengthOf(1)
    expect(data.series[0]).to.have.property('id', series[2].id)
    expect(data.series[0]).to.have.property('title', series[2].title)
    expect(data.series[0]).to.have.property('books')
    expect(data.series[0].books).to.be.an('array').with.lengthOf(series[2].books.length)
    expect(data.series[0].books).to.have.deep.members(series[2].books.map(book => ({ id: book.id })))

    expect(data.book).to.be.an('array').with.lengthOf(7)
    expect(data.book).to.have.deep.members(series[2].books.map(book => ({
      id: book.id,
      title: book.title,
      copyright: book.copyright,
      author: { id: book.author.id },
      reviews: book.reviews.map(review => ({ id: review.id })),
      publisher: { id: book.publisher.id },
      tags: book.tags.map(tag => ({ id: tag.id })),
    })))

    expect(data.tag).to.be.an('array').with.lengthOf(4)
    expect(data.tag).to.have.deep.members(tags)

    expect(data.author).to.be.an('array').with.lengthOf(2)
    expect(data.author).to.have.deep.members([authors[2], authors[4]].map((author) => {
      const newAuthor = {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
      }

      if (author.books) {
        newAuthor.books = author.books.map(book => ({ id: book.id }))
      }

      if (author.reviews) {
        newAuthor.reviews = author.reviews.map(review => ({ id: review.id }))
      }

      return newAuthor
    }))

    expect(data.review).to.be.an('array').with.lengthOf(2)
    expect(data.review).to.have.deep.members(_.flatMap(series[2].books, 'reviews').map((review) => {
      const newReview = { id: review.id }

      if (review.title) {
        newReview.title = review.title
      }

      if (review.content) {
        newReview.content = review.content
      }

      if (review.rating) {
        newReview.rating = review.rating
      }

      if (review.author) {
        newReview.author = { id: review.author.id }
      }

      return newReview
    }))

    expect(data.publisher).to.be.an('array').with.lengthOf(1)
    expect(data.publisher[0]).to.deep.equal(publishers[2])
  })

  it('single primary data and nest included data', function () {
    const payload = transformalizer.transform({ name: 'series', source: series[2] })
    const data = transformalizer.untransform({ document: payload, options: { untransformIncluded: true, nestIncluded: true } })

    expect(data).to.have.all.keys('series', 'book', 'tag', 'author', 'review', 'publisher')

    expect(data.series).to.be.an('array').with.lengthOf(1)
    expect(data.book).to.be.an('array').with.lengthOf(7)
    expect(data.tag).to.be.an('array').with.lengthOf(4)
    expect(data.author).to.be.an('array').with.lengthOf(2)
    expect(data.review).to.be.an('array').with.lengthOf(2)
    expect(data.publisher).to.be.an('array').with.lengthOf(1)

    expect(data.series[0]).to.have.property('id', series[2].id)
    expect(data.series[0]).to.have.property('title', series[2].title)
    expect(data.series[0]).to.have.property('books')
    expect(data.series[0].books).to.be.an('array').with.lengthOf(series[2].books.length)

    data.series[0].books.forEach((book) => {
      const expectedBook = series[2].books.find(b => book.id === b.id)

      expect(expectedBook).to.not.equal(undefined)
      expect(book).to.have.property('title', expectedBook.title)
      expect(book).to.have.property('copyright', expectedBook.copyright)

      expect(book).to.have.property('author')
      expect(book.author).to.have.property('id', expectedBook.author.id)
      expect(book.author).to.have.property('firstName', expectedBook.author.firstName)
      expect(book.author).to.have.property('lastName', expectedBook.author.lastName)
      expect(book.author.books).to.be.an('array').with.lengthOf(expectedBook.author.books.length)
      book.author.books.forEach((nestedBook) => {
        const expectedNestedBook = expectedBook.author.books.find(b => nestedBook.id === b.id)

        expect(expectedNestedBook).to.not.equal(undefined)
        expect(nestedBook).to.have.property('title', expectedNestedBook.title)
        expect(nestedBook).to.have.property('copyright', expectedNestedBook.copyright)
      })

      if (book.author.reviews) {
        expect(book.author.reviews).to.be.an('array').with.lengthOf(expectedBook.author.reviews.length)
        expect(book.author.reviews).to.have.deep.members(expectedBook.author.reviews.map(review => ({ id: review.id })))
      }

      expect(book.reviews).to.be.an('array').with.lengthOf(expectedBook.reviews.length)
      book.reviews.forEach((review) => {
        const expectedReview = expectedBook.reviews.find(r => review.id === r.id)

        expect(expectedReview).to.not.equal(undefined)
        expect(review.title).to.equal(expectedReview.title)
        expect(review.content).to.equal(expectedReview.content)
        expect(review.rating).to.equal(expectedReview.rating)

        if (expectedReview.author) {
          expect(review).to.have.property('author')
          expect(review.author).to.have.property('id', expectedReview.author.id)
          expect(review.author).to.have.property('firstName', expectedReview.author.firstName)
          expect(review.author).to.have.property('lastName', expectedReview.author.lastName)
        }
      })

      expect(book).to.have.property('publisher')
      expect(book.publisher).to.have.property('id', expectedBook.publisher.id)
      expect(book.publisher).to.have.property('name', expectedBook.publisher.name)

      expect(book.tags).to.be.an('array').with.lengthOf(expectedBook.tags.length)
      expect(book.tags).to.have.deep.members(expectedBook.tags)
    })
  })

  it('single primary data, nest included data, and remove circular references', function () {
    const payload = transformalizer.transform({ name: 'series', source: series[2] })
    const data = transformalizer.untransform({ document: payload, options: { untransformIncluded: true, nestIncluded: true, removeCircularDependencies: true } })
    const expectedSeries = _.cloneDeep(series[2])

    expectedSeries.books.forEach((book) => {
      book.reviews.forEach((review) => {
        if (review.author) {
          if (review.author.books) {
            review.author.books = review.author.books.map(b => ({ id: b.id }))
          }

          if (review.author.reviews) {
            review.author.reviews = review.author.reviews.map(r => ({ id: r.id }))
          }
        }
      })

      if (book.author.reviews) {
        book.author.reviews = book.author.reviews.map(review => ({ id: review.id }))
      }

      if (book.author.books) {
        book.author.books = book.author.books.map(nestedBook => ({ id: nestedBook.id }))
      }
    })

    expect(data).to.have.all.keys('series', 'book', 'tag', 'author', 'review', 'publisher')

    expect(data.series).to.be.an('array').with.lengthOf(1)
    expect(data.book).to.be.an('array').with.lengthOf(7)
    expect(data.tag).to.be.an('array').with.lengthOf(4)
    expect(data.author).to.be.an('array').with.lengthOf(2)
    expect(data.review).to.be.an('array').with.lengthOf(2)
    expect(data.publisher).to.be.an('array').with.lengthOf(1)

    expect(data.series[0]).to.be.deep.equal(expectedSeries)
  })

  it('multiple primary data, nest included data, and remove circular references', function () {
    const payload = transformalizer.transform({ name: 'series', source: series })
    const data = transformalizer.untransform({ document: payload, options: { untransformIncluded: true, nestIncluded: true, removeCircularDependencies: true } })

    const expectedSeries = _.cloneDeep(series)
    expectedSeries.forEach((s) => {
      s.books.forEach((book) => {
        book.reviews.forEach((review) => {
          if (review.author) {
            if (review.author.reviews) {
              review.author.reviews = review.author.reviews.map(nestedReview => ({ id: nestedReview.id }))
            }
          }
        })

        if (book.author.reviews) {
          book.author.reviews = book.author.reviews.map(review => ({ id: review.id }))
        }

        if (book.author.books) {
          book.author.books = book.author.books.map(nestedBook => ({ id: nestedBook.id }))
        }
      })
    })

    expect(data).to.have.all.keys('series', 'book', 'tag', 'author', 'review', 'publisher')

    expect(data.series).to.be.an('array').with.lengthOf(3)
    expect(data.book).to.be.an('array').with.lengthOf(17)
    expect(data.tag).to.be.an('array').with.lengthOf(4)
    expect(data.author).to.be.an('array').with.lengthOf(6)
    expect(data.review).to.be.an('array').with.lengthOf(6)
    expect(data.publisher).to.be.an('array').with.lengthOf(3)

    expect(data.series).to.be.deep.equal(expectedSeries)
  })
})

