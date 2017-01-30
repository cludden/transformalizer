import { expect } from 'chai'
import { describe, it } from 'mocha'
import faker from 'faker'

import serializer, { article } from '../serializers/simple'

const schemaOptions = { baseUrl: 'https://api.example.com' }

describe('simple', function () {
  it('works', function () {
    const input = {
      _id: faker.random.uuid(),
      _source: {
        alternateTitle_en: faker.lorem.words(3),
        alternateTitle_es: faker.lorem.words(3),
        createdAt: faker.date.past(2).toISOString(),
        languageAvailability: ['en', 'es'],
        people: [{
          id: faker.random.uuid(),
          type: 'person',
          images: [{
            id: faker.random.uuid(),
            types: ['profile'],
          }],
          name: `${faker.name.firstName()} ${faker.name.lastName()}`,
          roles: ['author'],
        }],
        primaryLanguage: 'en',
        title_en: faker.lorem.words(3),
        title_es: faker.lorem.words(3),
      },
    }
    const options = { language: 'es' }
    return serializer.serialize({ type: 'article', input, options })
    .then((payload) => {
      expect(payload).to.be.an('object')
      expect(payload).to.have.all.keys('jsonapi', 'data', 'included')
      expect(payload.jsonapi).to.have.property('version', '1.0')
      expect(payload.data).to.be.an('object')
      expect(payload.data).to.have.all.keys('type', 'id', 'meta', 'links', 'attributes', 'relationships')
      expect(payload.data.type).to.equal('article')
      expect(payload.data.id).to.equal(input._id)
      expect(payload.data.meta).to.be.an('object')
      expect(payload.data.meta).to.have.all.keys('language')
      expect(payload.data.meta.language).to.equal(options.language)
      expect(payload.data.links).to.be.an('object')
      expect(payload.data.links).to.have.all.keys('self')
      expect(payload.data.links.self).to.equal(`${schemaOptions.baseUrl}/${article.options.basePath}/${input._id}`)
      expect(payload.data.attributes).to.be.an('object')
      expect(payload.data.attributes).to.have.all.keys('alternateTitle', 'createdAt', 'people', 'primaryLanguage', 'title')
      expect(payload.data.attributes.alternateTitle).to.equal(input._source.alternateTitle_es)
      expect(payload.data.attributes.title).to.equal(input._source.title_es)
      expect(payload.data.relationships).to.be.an('object')
      expect(payload.data.relationships).to.have.all.keys('people')
      expect(payload.data.relationships.people).to.be.an('object')
      expect(payload.data.relationships.people).to.have.all.keys('data', 'links')
      expect(payload.data.relationships.people.links).to.be.an('object')
      expect(payload.data.relationships.people.links).to.have.all.keys('self', 'related')
      expect(payload.data.relationships.people.data).to.be.an('array').with.lengthOf(1)
      expect(payload.data.relationships.people.data[0]).to.be.an('object')
      expect(payload.data.relationships.people.data[0]).to.have.all.keys('type', 'id', 'meta')
      expect(payload.data.relationships.people.data[0].type).to.equal('person')
      expect(payload.data.relationships.people.data[0].id).to.equal(input._source.people[0].id)
      expect(payload.data.relationships.people.data[0].meta).to.be.an('object')
      expect(payload.data.relationships.people.data[0].meta).to.have.all.keys('roles')
      expect(payload.data.relationships.people.data[0].meta.roles).to.deep.equal(input._source.people[0].roles) // eslint-disable-line
      expect(payload.included).to.be.an('array').with.lengthOf(1)
      expect(payload.included[0]).to.be.an('object')
      expect(payload.included[0]).to.have.all.keys('type', 'id', 'attributes', 'relationships')
    })
  })
})
