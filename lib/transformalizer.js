/* eslint no-use-before-define: off */
import R from 'ramda'

const isFunction = R.is(Function)
const isObject = R.both(R.is(Object), x => !Array.isArray(x))

export default function createTransformalizer(baseOptions) {
  const registry = {}

  /**
   * Register a schema
   * @param  {Object} args
   * @param  {String} args.name - schema name/id
   * @param  {Object} args.schema - schema definition
   * @param  {Object} [args.options={}] - schema options to be merged in to transform options
   * @return {Undefined}
   */
  function register({ name, schema, options: schemaOptions }) {
    if (!R.is(String, name)) {
      throw new Error('Invalid "name" Property (non string)')
    }
    registry[name] = {
      schema: validateSchema({ name, schema }),
      options: schemaOptions,
    }
    return undefined
  }

  /**
   * Transform raw data into a valid JSON API document
   * @param  {Object} args
   * @param  {String} args.name - the top level schema name
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} [options={}] - function level options
   * @return {Object} document
   */
  function transform({ name, source, options: opts }) {
    const docSchema = registry[name]
    if (!docSchema) {
      throw new Error(`Missing Schema: ${name}`)
    }
    const include = createInclude({ source, options: opts })
    const data = transformSource({ docSchema, source, options: opts, include })
    const included = include.get()
    // process source
    // process included
    // process top level links
    // process top level meta
    const document = {
      jsonapi: {
        version: '1.0',
      },
      data,
    }
    if (included.length) {
      document.included = included
    }
    return document
  }

  /**
   * [transformSource description]
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  function transformSource(args) {
    const { docSchema, source, options: opts, include } = args
    // TODO define include
    if (Array.isArray(source)) {
      return source.map(data => transformData({ docSchema, source, options: opts, data, include }))
    }
    return transformData({ docSchema, source, options: opts, data: source, include })
  }

  /**
   * [transformData description]
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  function transformData(args) {
    const { docSchema, source, options: opts, data, include, _type, _id } = args
    // call dataSchema if defined and switch contexts if necessary
    let dataSchema = docSchema
    if (isFunction(docSchema.schema.data.dataSchema)) {
      const name = docSchema.schema.data.dataSchema({ source, data, options: opts })
      if (name !== docSchema.name) {
        dataSchema = registry[name]
        if (!dataSchema) {
          throw new Error(`Missing Schema: ${name}`)
        }
      }
    }
    const options = R.clone(R.mergeAll([{}, baseOptions, dataSchema.options, opts]))
    const params = { dataSchema, source, options, data }
    const type = params.type = _type || getType(params)
    const id = params.id = _id || getId(params)
    const attributes = params.attributes = getAttributes(params)
    const relationships = params.relationships = getRelationships({ include, ...params })
    const links = params.links = getLinks(params)
    const meta = params.meta = getMeta(params)
    // build resulting resource
    const resource = { type, id }
    if (isObject(attributes)) {
      resource.attributes = attributes
    }
    if (isObject(relationships)) {
      resource.relationships = relationships
    }
    if (isObject(meta)) {
      resource.meta = meta
    }
    if (isObject(links)) {
      resource.links = links
    }
    return resource
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @return {String} type
   */
  function getType(args) {
    const { dataSchema, ...others } = args
    const type = dataSchema.schema.data.type(others)
    if (!R.is(String, type)) {
      throw new TransformError('Invalid type', args)
    }
    return type
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @return {String} type
   */
  function getId(args) {
    const { dataSchema, ...others } = args
    const id = dataSchema.schema.data.id(others)
    if (!R.is(String, id)) {
      throw new TransformError('Invalid id', args)
    }
    return id
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @return {String} type
   */
  function getAttributes(args) {
    const { dataSchema, ...others } = args
    const attributes = dataSchema.schema.data.attributes(others)
    return attributes
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.include
   * @return {String} type
   */
  function getRelationships(args) {
    const { dataSchema, ...others } = args
    const relSchema = dataSchema.schema.data.relationships
    if (relSchema) {
      const keys = Object.keys(relSchema)
      return keys.reduce((memo, key) => {
        const fn = relSchema[key]
        const relationship = getRelationship({ fn, ...others })
        if (isObject(relationship)) {
          memo[key] = relationship
        }
        return memo
      }, {})
    }
    return undefined
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.fn
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.include
   * @return {String} type
   */
  function getRelationship(args) {
    const { fn, include, ...others } = args
    const result = fn(others)
    const { meta, links, data } = R.pickAll(['meta', 'links', 'data'], result)
    if (!links && !meta && !data) {
      return undefined
    }
    const relationship = {}
    if (data && typeof data === 'object') { // ensure its an array or object
      if (Array.isArray(data)) {
        relationship.data = data.map(item => transformRelationshipData({
          item,
          source: args.source,
          options: args.options,
          include,
        }))
      } else {
        relationship.data = transformRelationshipData({
          item: data,
          source: args.source,
          options: args.options,
          include,
        })
      }
    }
    if (isObject(meta)) {
      relationship.meta = meta
    }
    if (isObject(links)) {
      relationship.links = links
    }
    return relationship
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.item
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {Function} args.include
   * @return {String} type
   */
  function transformRelationshipData(args) {
    const { item, source, options, include } = args
    const { name, data, included, meta, links } = item
    if (!R.is(String, name) || !registry[name]) {
      throw new TransformError(`Missing Schema: ${name}`, args)
    }
    if (!data) {
      throw new TransformError('Missing Relationship Data', args)
    }
    const relSchema = registry[name]
    const type = getType({ dataSchema: relSchema, source, options, data })
    const id = getId({ dataSchema: relSchema, source, options, data })
    const result = { type, id }
    if (isObject(meta)) {
      result.meta = meta
    }
    if (isObject(links)) {
      result.links = links
    }
    if (included === true && !include.exists({ type, id })) {
      const resource = transformData({
        docSchema: relSchema,
        source,
        options,
        data,
        include,
        _type: type,
        _id: id,
      })
      include.include(resource)
    }
    return result
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.relationships
   * @return {String} type
   */
  function getLinks(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.links) {
      return dataSchema.schema.data.links(others)
    }
    return undefined
  }

  /**
   * [getType description]
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {*} args.source
   * @param  {*} args.options
   * @param  {*} args.data
   * @param  {*} args.type
   * @param  {*} args.id
   * @param  {*} args.attributes
   * @param  {*} args.relationships
   * @param  {*} args.links
   * @return {String} type
   */
  function getMeta(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.meta) {
      return dataSchema.schema.data.meta(others)
    }
    return undefined
  }

  function createInclude() {
    const included = []
    const alreadyIncluded = {}
    return {
      exists({ type, id }) {
        return alreadyIncluded[`${type}:${id}`]
      },

      include(resource) {
        alreadyIncluded[`${resource.type}:${resource.id}`] = true
        included.push(resource)
      },

      get() {
        return included
      },
    }
  }

  return {
    register,
    transform,
  }
}

function TransformError(msg, args) {
  Error.captureStackTrace(this, TransformError)
  this.message = msg
  this.args = args
}

/**
 * Validate a schema definition
 * @param  {Object} args
 * @param  {String} args.name - schema name/id
 * @param  {Object} args.schema - schema definition
 * @return {Object} validated
 */
export function validateSchema({ name, schema }) {
  if (!isObject(schema) || !schema.data) {
    throw new Error('Invalid "schema" Property')
  }
  if (!isObject(schema.data)) {
    throw new Error('Invalid "schema.data" Property')
  }
  // validate id
  if (!isFunction(schema.data.id)) {
    schema.id = R.prop('id')
  }
  // validate type
  if (!isFunction(schema.data.type)) {
    schema.type = R.always(name)
  }
  if (schema.data.links && !isFunction(schema.data.links)) {
    throw new Error('Invalid "schema.data.links" Property')
  }
  if (schema.data.meta && !isFunction(schema.data.meta)) {
    throw new Error('Invalid "schema.data.meta" Property')
  }
  // validate attributes
  if (schema.data.attributes && !isFunction(schema.data.attributes)) {
    throw new Error('Invalid "schema.data.attributes" Property')
  }
  // validate relationships
  if (schema.data.relationships) {
    if (!isObject(schema.data.relationships)) {
      throw new Error('Invalid "schema.data.relationships" Property')
    } else {
      Object.keys(schema.data.relationships).forEach((rel) => {
        if (!isFunction(schema.data.relationships[rel])) {
          throw new Error(`Invalid Schema: Relationship "${rel}" should be a function`)
        }
      })
    }
  }
  if (schema.links && !isFunction(schema.links)) {
    throw new Error('Invalid "schema.links" Property')
  }
  if (schema.meta && !isFunction(schema.meta)) {
    throw new Error('Invalid "schema.meta" Property')
  }
  return schema
}
