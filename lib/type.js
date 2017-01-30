

export default class Type {
  constructor({ schema, options }) {
    this._options = options
    this._schema = schema
    if (typeof this._schema.id )
  }

  serializeAttributes({ data, input, options }) {
    return this._schema.attributes({ data, input, options })
  }

  serializeDataLinks({ attributes, data, id, input, options, relationships, type }) {
    return this._schema.links({ attributes, data, id, input, options, relationships, type })
  }

  serializeDataMeta({ attributes, data, id, input, options, relationships, type }) {
    return this._schema.meta({ attributes, data, id, input, options, relationships, type })
  }

  serializeId({ data, input, options }) {
    return this._schema.id({ data, input, options })
  }

  serializeRelationships({ attributes, data, id, included, input, options, type }) {
    const { relationships } = this._schema
    return Object.keys(this._schema.relationships || {}).reduce((memo, rel) => {
      memo[rel] = relationships[rel]({ attributes, data, id, included, input, options, type })
      return memo
    }, {})
  }

  serializeType({ input, data, options }) {
    return this._schema.type({ data, input, options })
  }

  validateSchema(schema) {
    if (!)
  }
}
