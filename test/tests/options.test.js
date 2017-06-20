import { expect } from 'chai'
import _ from 'lodash'
import { describe, it } from 'mocha'
import faker from 'faker'

import create from '../../lib/transformalizer'

const schemaOptions = { baseUrl: 'https://api.example.com', count: 0 }

const transformalizer = create(schemaOptions)
transformalizer.register({
  name: 'post',
  schema: {
    data: {
      meta({ state }) {
        return { random: state.random }
      },
      attributes({ data, options, state }) {
        options.count += 1
        state.random = _.uniqueId('random')
        return _(data)
        .pick(['title', 'body', 'shortDescription'])
        .mapKeys((val, key) => _.snakeCase(key))
        .value()
      },
      relationships: {
        author({ data, state }) {
          return {
            data: {
              name: 'user',
              data: data.author,
              incldued: true,
              meta: { random: state.random },
            },
          }
        },
        comments({ data, state }) {
          return {
            data: data.comments.map(c => ({
              name: 'comment',
              data: c,
              included: true,
              meta: { random: state.random },
            })),
          }
        },
      },
    },
  },
})
transformalizer.register({
  name: 'comment',
  schema: {
    data: {
      meta({ state }) {
        return { random: state.random }
      },
      attributes({ data, options, state }) {
        options.count += 1
        state.random = _.uniqueId('random')
        return _.pick(data, 'value')
      },
      relationships: {
        author({ data, state }) {
          return {
            data: {
              name: 'user',
              data: data.author,
              incldued: true,
              meta: { random: state.random },
            },
          }
        },
      },
    },
  },
})
transformalizer.register({
  name: 'user',
  schema: {
    data: {
      meta({ state }) {
        return { random: state.random }
      },
      attributes({ data, options, state }) {
        options.count += 1
        state.random = _.uniqueId('random')
        return _(data)
        .pick(['firstName', 'lastName'])
        .mapKeys((val, key) => _.snakeCase(key))
        .value()
      },
    },
  },
})

describe('simple', function () {
  it('builds the correct document with a single article', function () {
    const users = _.range(3).map(i => ({
      id: i,
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    }))
    const posts = _.range(2).map(i => ({
      id: i,
      title: faker.lorem.words(3),
      body: faker.lorem.paragraph(),
      shortDescription: faker.lorem.sentence(),
      author: _.sample(users),
      comments: users.map((u, a) => ({
        id: a,
        value: faker.lorem.sentence(),
        author: u,
      })),
    }))
    const doc = transformalizer.transform({ name: 'post', source: posts })
    expect(doc).to.have.deep.property('jsonapi.version', '1.0')
    expect(doc).to.have.property('data').that.is.an('array').with.lengthOf(posts.length)
    expect(_.get(doc, 'data.0.meta.random')).to.not.equal(_.get(doc, 'data.1.meta.random'))
  })
})
