import { expect } from 'chai'
import _ from 'lodash'

import createTransformalizer from '../../lib/transformalizer'

// create a new transformalizer
const transformalizer = createTransformalizer({ url: 'https://api.example.com' })

// register a schema
transformalizer.register({
  name: 'article',
  schema: {
    links({ source, options }) {
      if (Array.isArray(source)) {
        return { self: `${options.url}/articles` }
      }
      return undefined
    },
    meta({ source }) {
      if (Array.isArray(source)) {
        return { count: source.length }
      }
      return undefined
    },
    data: {
      type() {
        return 'article'
      },
      id({ data }) {
        return data.id.toString()
      },
      attributes({ data }) {
        return _(data)
        .pick('title', 'body', 'createdAt')
        .mapKeys((v, k) => _.snakeCase(k))
      },
      relationships: {
        author({ data, options, id }) {
          const { author } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/author`,
            related: `${options.url}/articles/${id}/author`,
          }
          if (!author) {
            return { links }
          }
          const included = _.isObject(author)
          return {
            data: {
              name: 'user',
              data: included ? author : { id: author },
              included,
            },
            links,
          }
        },
        comments({ data, options, id }) {
          const { comments } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/comments`,
            related: `${options.url}/articles/${id}/comments`,
          }
          if (!Array.isArray(comments) || !comments.length) {
            return { links }
          }
          const included = _.isObject(comments[0])
          return {
            data: comments.map(comment => ({
              name: 'comment',
              data: included ? comment : { id: comment },
              included,
            })),
            links,
          }
        },
      },
      links({ options, id }) {
        return { self: `${options.url}/articles/${id}` }
      },
    },
  },
})

// register related schemas
transformalizer.register({
  name: 'user',
  schema: {
    links({ source, options }) {
      if (Array.isArray(source)) {
        return { self: `${options.url}/users` }
      }
      return undefined
    },
    meta({ source }) {
      if (Array.isArray(source)) {
        return { count: source.length }
      }
      return undefined
    },
    data: {
      type() {
        return 'user'
      },
      id({ data }) {
        return data.id.toString()
      },
      attributes({ data }) {
        return _(data)
        .pick('firstName', 'lastName', 'email')
        .mapKeys((v, k) => _.snakeCase(k))
      },
      relationships: {
        articles({ data, options, id }) {
          const { articles } = data
          const links = {
            self: `${options.url}/users/${id}/relationships/articles`,
            related: `${options.url}/users/${id}/articles`,
          }
          if (!Array.isArray(articles) || !articles.length) {
            return { links }
          }
          const included = _.isObject(articles[0])
          return {
            data: articles.map(article => ({
              name: 'article',
              data: included ? article : { id: article },
              included,
            })),
            links,
          }
        },
        comments({ data, options, id }) {
          const { comments } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/comments`,
            related: `${options.url}/articles/${id}/comments`,
          }
          if (!Array.isArray(comments) || !comments.length) {
            return { links }
          }
          const included = _.isObject(comments[0])
          return {
            data: comments.map(comment => ({
              name: 'comment',
              data: included ? comment : { id: comment },
              included,
            })),
            links,
          }
        },
      },
      links({ options, id }) {
        return { self: `${options.url}/users/${id}` }
      },
    },
  },
})

transformalizer.register({
  name: 'comment',
  schema: {
    data: {
      type() {
        return 'comment'
      },
      id({ data }) {
        return data.id.toString()
      },
      attributes({ data }) {
        return _.pick(data, 'body')
      },
      relationships: {
        article({ data, options, id }) {
          const { article } = data
          const links = {
            self: `${options.url}/users/${id}/relationships/article`,
            related: `${options.url}/users/${id}/article`,
          }
          if (!article) {
            return { links }
          }
          const included = _.isObject(article)
          return {
            data: {
              name: 'article',
              data: included ? article : { id: article },
            },
            links,
          }
        },
        author({ data, options, id }) {
          const { author } = data
          const links = {
            self: `${options.url}/articles/${id}/relationships/author`,
            related: `${options.url}/articles/${id}/author`,
          }
          if (!author) {
            return { links }
          }
          const included = _.isObject(author)
          return {
            data: {
              name: 'user',
              data: included ? author : { id: author },
            },
            links,
          }
        },
      },
      links({ options, id }) {
        return { self: `${options.url}/comments/${id}` }
      },
    },
  },
})

const articles = [{
  id: 1,
  title: 'First Article',
  body: 'Hello, World!',
  createdAt: new Date(),
  author: 2,
}, {
  id: 2,
  title: 'Second Article',
  body: 'Hola, World!',
  createdAt: new Date(),
  author: 1,
}]

const users = [{
  id: 1,
  firstName: 'Kanye',
  lastName: 'West',
  email: 'kwest@example.com',
}, {
  id: 2,
  firstName: 'A$AP',
  lastName: 'Ferg',
  email: 'ferg@example.com',
}]

const comments = [{
  id: 1,
  body: 'Nice article Ferg!',
  author: 1,
  article: 1,
}, {
  id: 2,
  body: 'Thanks Yeezy!',
  author: 2,
  article: 1,
}, {
  id: 3,
  body: 'First!',
  author: 2,
  article: 2,
}, {
  id: 4,
  body: 'nah man',
  author: 1,
  article: 2,
}]

const source = articles.map((article) => {
  const populated = _.pick(article, 'id', 'body', 'createdAt')
  populated.author = _.find(users, { id: article.author })
  populated.comments = _.filter(comments, { article: article.id }).map(({ author, ...others }) => ({
    author: _.find(users, { id: author }),
    ...others,
  }))
  return populated
})

console.log(JSON.stringify(source))
const document = transformalizer.transform({ name: 'article', source })
console.log(JSON.stringify(document))
