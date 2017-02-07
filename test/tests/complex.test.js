import { expect } from 'chai'
import faker from 'faker'
import _ from 'lodash'
import { describe, it } from 'mocha'

import transformalizer from '../transformalizers/complex'

const tags = _.range(10).map(() => ({
  _type: 'tag',
  id: faker.random.uuid(),
  name: faker.lorem.word(),
  desc: faker.lorem.sentence(),
}))

const articles = _.range(5).map(() => ({
  _type: 'article',
  id: faker.random.uuid(),
  title: faker.lorem.words(3),
  body: faker.lorem.paragraph(),
  tags: _.sampleSize(tags, _.random(1, 2)),
}))

const videos = _.range(5).map(() => ({
  _type: 'video',
  id: faker.random.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  tags: _.sampleSize(tags, _.random(1, 2)),
}))

const content = articles.slice().concat(videos.slice())

const collections = _.range(2).map(() => ({
  _type: 'collection',
  id: faker.random.uuid(),
  name: faker.lorem.words(3),
  desc: faker.lorem.paragraph(),
  tags: _.sampleSize(tags, _.random(1, 2)),
  content: _.sampleSize(content, 5),
}))

describe('complex', function () {
  it('builds the correct document with a single collection', function () {
    const source = _.sample(collections)
    const payload = transformalizer.transform({ name: 'collection', source })
    expect(payload).to.be.an('object').with.all.keys('jsonapi', 'data', 'included')
    expect(payload).to.have.property('data').that.is.an('object')
    expect(payload.data).to.have.all.keys('type', 'id', 'attributes', 'relationships', 'links')
    expect(payload.data).to.have.property('type', 'collection')
    expect(payload.data).to.have.property('id', source.id)
    expect(payload.data).to.have.property('attributes').that.is.an('object')
    expect(payload.data.attributes).to.have.property('name', source.name)
    expect(payload.data.attributes).to.have.property('desc', source.desc)
    expect(payload.data).to.have.property('relationships').that.is.an('object')
    expect(payload.data.relationships).to.have.property('content')
    expect(payload.data.relationships.content).to.be.an('object')
    expect(payload.data.relationships.content).with.all.keys('data')
    expect(payload.data.relationships.content.data).to.be.an('array').with.lengthOf(source.content.length)
    payload.data.relationships.content.data.forEach((rel, i) => {
      expect(rel).to.be.an('object').with.all.keys('type', 'id')
      expect(rel).to.have.property('type', source.content[i]._type)
      expect(rel).to.have.property('id', source.content[i].id)
    })
    expect(payload.data.relationships).to.have.property('tags')
    expect(payload.data.relationships.tags).to.be.an('object')
    expect(payload.data.relationships.tags).with.all.keys('data')
    expect(payload.data.relationships.tags.data).to.be.an('array').with.lengthOf(source.tags.length)
    payload.data.relationships.tags.data.forEach((rel, i) => {
      expect(rel).to.be.an('object').with.all.keys('type', 'id')
      expect(rel).to.have.property('type', source.tags[i]._type)
      expect(rel).to.have.property('id', source.tags[i].id)
    })
    let expectedIncluded = []
    source.tags.forEach(tag => expectedIncluded.push(`tag:${tag.id}`))
    source.content.forEach((c) => {
      expectedIncluded.push(`${c._type}:${c.id}`)
      c.tags.forEach(tag => expectedIncluded.push(`tag:${tag.id}`))
    })
    expectedIncluded = _.uniq(expectedIncluded).sort()
    expect(payload.included).to.be.an('array').with.lengthOf(expectedIncluded.length)
    const included = payload.included.map(item => `${item.type}:${item.id}`)
    expect(_.intersection(expectedIncluded, included).sort()).to.deep.equal(expectedIncluded)
    // TODO verify included structure
  })
})
