import { expect } from 'chai'
import { describe, it } from 'mocha'
import faker from 'faker'

import transformalizer from '../transformalizers/simple'

const schemaOptions = { baseUrl: 'https://api.example.com' }

describe('simple', function () {
  it('builds the correct document with a single article', function () {
    const source = {
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
    const payload = transformalizer.transform({ name: 'article', source, options })
    expect(payload).to.be.an('object')
    expect(payload).to.have.all.keys('jsonapi', 'data', 'included')
    expect(payload.jsonapi).to.have.property('version', '1.0')
    expect(payload.data).to.be.an('object')
    expect(payload.data).to.have.all.keys('type', 'id', 'meta', 'links', 'attributes', 'relationships')
    expect(payload.data.type).to.equal('article')
    expect(payload.data.id).to.equal(source._id)
    expect(payload.data.meta).to.be.an('object')
    expect(payload.data.meta).to.have.all.keys('language')
    expect(payload.data.meta.language).to.equal(options.language)
    expect(payload.data.links).to.be.an('object')
    expect(payload.data.links).to.have.all.keys('self')
    expect(payload.data.links.self).to.equal(`${schemaOptions.baseUrl}/content/articles/${source._id}?language=${options.language}`)
    expect(payload.data.attributes).to.be.an('object')
    expect(payload.data.attributes).to.have.all.keys('alternateTitle', 'createdAt', 'primaryLanguage', 'title')
    expect(payload.data.attributes.alternateTitle).to.equal(source._source.alternateTitle_es)
    expect(payload.data.attributes.title).to.equal(source._source.title_es)
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
    expect(payload.data.relationships.people.data[0].id).to.equal(source._source.people[0].id)
    expect(payload.data.relationships.people.data[0].meta).to.be.an('object')
    expect(payload.data.relationships.people.data[0].meta).to.have.all.keys('roles')
    expect(payload.data.relationships.people.data[0].meta.roles).to.deep.equal(source._source.people[0].roles) // eslint-disable-line
    expect(payload.included).to.be.an('array').with.lengthOf(1)
    expect(payload.included[0]).to.be.an('object')
    expect(payload.included[0]).to.have.all.keys('type', 'id', 'attributes')
  })

  it('builds the correct document with multiple articles', function () {
    const person = {
      id: faker.random.uuid(),
      type: 'person',
      images: [{
        id: faker.random.uuid(),
        types: ['profile'],
      }],
      name: `${faker.name.firstName()} ${faker.name.lastName()}`,
      roles: ['author'],
    }
    const source = [{
      _id: faker.random.uuid(),
      _source: {
        alternateTitle_en: faker.lorem.words(3),
        alternateTitle_es: faker.lorem.words(3),
        createdAt: faker.date.past(2).toISOString(),
        languageAvailability: ['en', 'es'],
        people: [person],
        primaryLanguage: 'en',
        title_en: faker.lorem.words(3),
        title_es: faker.lorem.words(3),
      },
    }, {
      _id: faker.random.uuid(),
      _source: {
        alternateTitle_en: faker.lorem.words(3),
        createdAt: faker.date.past(2).toISOString(),
        languageAvailability: ['en'],
        people: [person, {
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
      },
    }]
    const options = { language: 'es' }
    const payload = transformalizer.transform({ name: 'article', source, options })
    expect(payload).to.be.an('object')
    expect(payload).to.have.all.keys('jsonapi', 'data', 'included')
    expect(payload.jsonapi).to.have.property('version', '1.0')
    expect(payload.data).to.be.an('array').with.lengthOf(source.length)
    payload.data.forEach((resource, i) => {
      const s = source[i]
      const language = s._source.languageAvailability.indexOf(options.language) === -1
        ? s._source.primaryLanguage
        : options.language
      expect(resource).to.have.all.keys('type', 'id', 'meta', 'links', 'attributes', 'relationships')
      expect(resource.type).to.equal('article')
      expect(resource.id).to.equal(s._id)
      expect(resource.meta).to.be.an('object')
      expect(resource.meta).to.have.all.keys('language')
      expect(resource.meta.language).to.equal(language)
      expect(resource.links).to.be.an('object')
      expect(resource.links).to.have.all.keys('self')
      expect(resource.links.self)
      .to.equal(`${schemaOptions.baseUrl}/content/articles/${s._id}?language=${language}`)
      expect(resource.attributes).to.be.an('object')
      expect(resource.attributes).to.have.all.keys('alternateTitle', 'createdAt', 'primaryLanguage', 'title')
      expect(resource.attributes.alternateTitle).to.equal(s._source[`alternateTitle_${language}`])
      expect(resource.attributes.title).to.equal(s._source[`title_${language}`])
      expect(resource.relationships).to.be.an('object')
      expect(resource.relationships).to.have.all.keys('people')
      expect(resource.relationships.people).to.be.an('object')
      expect(resource.relationships.people).to.have.all.keys('data', 'links')
      expect(resource.relationships.people.links).to.be.an('object')
      expect(resource.relationships.people.links).to.have.all.keys('self', 'related')
      expect(resource.relationships.people.data).to.be.an('array').with.lengthOf(s._source.people.length)
      resource.relationships.people.data.forEach((p, a) => {
        expect(p).to.be.an('object')
        expect(p).to.have.all.keys('type', 'id', 'meta')
        expect(p.type).to.equal('person')
        expect(p.id).to.equal(s._source.people[a].id)
        expect(p.meta).to.be.an('object')
        expect(p.meta).to.have.all.keys('roles')
        expect(p.meta.roles)
        .to.deep.equal(s._source.people[a].roles)
      })
    })
    expect(payload.included).to.be.an('array').with.lengthOf(2)
    payload.included.forEach((included, i) => {
      expect(included).to.be.an('object')
      expect(included).to.have.all.keys('type', 'id', 'attributes')
      expect(included.id).to.equal(source[1]._source.people[i].id)
    })
  })
})
