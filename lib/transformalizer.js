import {
  isFunction,
  isObject,
  isString,
  TransformError,
  validateSchema,
} from './utils'

/**
 * Transformalizer factory function.
 * @param  {Object} [baseOptions={}]
 * @return {Object} transformalizer
 */
export default function createTransformalizer(baseOptions = {}) {
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
    if (!isString(name)) {
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
   * @param  {Object|Object[]} args.source - a single source object or an aray of source objects
   * @param  {Object} [options={}] - function level options
   * @return {Object} document
   */
  function transform({ name, source, options: opts }) {
    if (!isString(name)) {
      throw new TransformError('Invalid "name" Property (non string)', { name, source, options: opts })
    }
    const docSchema = registry[name]
    if (!docSchema) {
      throw new TransformError(`Missing Schema: ${name}`, { name, source, options: opts })
    }
    const options = Object.assign({}, baseOptions, opts)
    const include = createInclude({ source, options })
    const data = transformSource({ docSchema, source, options, include })
    const included = include.get()
    const document = {
      jsonapi: {
        version: '1.0',
      },
    }
    // add top level properties if available
    const topLevel = ['links', 'meta']
    topLevel.forEach((prop) => {
      if (docSchema.schema[prop]) {
        const result = docSchema.schema[prop]({ source, options, data, included })
        if (isObject(result)) {
          document[prop] = result
        }
      }
    })
    document.data = data
    if (included.length) {
      document.included = included
    }
    return document
  }

  /**
   * Transform source into the "primary data" of the document
   * @param  {Object} args
   * @param  {Object} args.docSchema - the top level schema used for transforming the document
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} args.options - function level options
   * @param  {Object} args.include - include object
   * @return {Object|Object[]}
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
   * Transform a single source object into a valid resource object
   * @param  {Object} arg
   * @param  {Object} args.docSchema - the top level schema used for transforming the document
   * @param  {Object|Object[]} args.source - source data
   * @param  {Object} args.options - function level options
   * @param  {Object} args.data - current source object
   * @param  {Object} args.include - include object
   * @param  {String} [args._type] - (for use by transformRelationshipData)
   * @param  {String} [args._id] - (for use by transformRelationshipData)
   * @return {Object}
   */
  function transformData(args) {
    const { docSchema, source, options, data, include, _type, _id } = args
    // call dataSchema if defined and switch contexts if necessary
    let dataSchema = docSchema
    if (isFunction(docSchema.schema.data.dataSchema)) {
      const name = docSchema.schema.data.dataSchema({ source, data, options })
      if (name !== docSchema.name) {
        dataSchema = registry[name]
        if (!dataSchema) {
          throw new Error(`Missing Schema: ${name}`)
        }
      }
    }
    const state = {}
    const params = { dataSchema, source, options, data, state }
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
   * Get the resource type for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @return {String} type
   * @private
   */
  function getType(args) {
    const { dataSchema, ...others } = args
    const type = dataSchema.schema.data.type(others)
    if (!isString(type)) {
      throw new TransformError('Invalid type', args)
    }
    return type
  }

  /**
   * Get the resource id for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @return {String} id
   * @private
   */
  function getId(args) {
    const { dataSchema, ...others } = args
    const id = dataSchema.schema.data.id(others)
    if (!isString(id)) {
      throw new TransformError('Invalid id', args)
    }
    return id
  }

  /**
   * Get the resource attributes object for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @return {Object} attributes
   * @private
   */
  function getAttributes(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.attributes) {
      const attributes = dataSchema.schema.data.attributes(others)
      return attributes
    }
    return undefined
  }

  /**
   * Get the resource relationships object for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.include
   * @return {Object} relationships
   * @private
   */
  function getRelationships(args) {
    const { dataSchema, ...others } = args
    const relSchema = dataSchema.schema.data.relationships
    if (relSchema) {
      const keys = Object.keys(relSchema)
      const relationships = keys.reduce((memo, key) => {
        const fn = relSchema[key]
        const relationship = getRelationship({ fn, ...others })
        if (isObject(relationship)) {
          memo[key] = relationship
        }
        return memo
      }, {})
      if (!Object.keys(relationships).length) {
        return undefined
      }
      return relationships
    }
    return undefined
  }

  /**
   * Get the resource relationship object for the current relationship of the
   * current source object
   * @param  {Object} args
   * @param  {Object} args.fn
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.include
   * @return {Object} relationship
   * @private
   */
  function getRelationship(args) {
    const { fn, include, ...others } = args
    const result = fn(others)
    if (!isObject(result)) {
      return undefined
    }
    const { meta, links, data } = result
    const invalidData = !data || typeof data !== 'object'
    if (!links && !meta && invalidData) {
      return undefined
    }
    const relationship = {}
    if (!invalidData) {
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
   * Get the data for the current relationship object for the current source
   * object
   * @param  {Object} args
   * @param  {Object} args.item - the current data item
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Function} args.include
   * @return {Object} data
   * @private
   */
  function transformRelationshipData(args) {
    const { item, source, options, include } = args
    const { name, data, included, meta } = item
    if (!isString(name) || !registry[name]) {
      throw new TransformError(`Missing Schema: ${name}`, args)
    }
    const relSchema = registry[name]
    const type = getType({ dataSchema: relSchema, source, options, data })
    const id = getId({ dataSchema: relSchema, source, options, data })
    const result = { type, id }
    if (isObject(meta)) {
      result.meta = meta
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
   * Get the resource links for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.relationships
   * @return {Object} links
   * @private
   */
  function getLinks(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.links) {
      return dataSchema.schema.data.links(others)
    }
    return undefined
  }

  /**
   * Get the resource meta for the current source object
   * @param  {Object} args
   * @param  {Object} args.dataSchema
   * @param  {Object|Object[]} args.source
   * @param  {Object} args.options
   * @param  {Object} args.data
   * @param  {String} args.type
   * @param  {String} args.id
   * @param  {Object} args.attributes
   * @param  {Object} args.relationships
   * @param  {Object} args.links
   * @return {Object} meta
   * @private
   */
  function getMeta(args) {
    const { dataSchema, ...others } = args
    if (dataSchema.schema.data.meta) {
      return dataSchema.schema.data.meta(others)
    }
    return undefined
  }

  /**
   * Create an include object
   * @return {Object} include
   * @private
   */
  function createInclude() {
    const included = []
    const alreadyIncluded = {}
    return {
      /**
       * Determine whether or not a given resource has already been included
       * @param {Object} args
       * @param {String} args.type
       * @param {String} args.id
       * @return {Boolean}
       */
      exists({ type, id }) {
        return alreadyIncluded[`${type}:${id}`]
      },

      /**
       * Add an included resource to the included section of the document
       * @param {Object} resource
       * @return {Undefined}
       */
      include(resource) {
        alreadyIncluded[`${resource.type}:${resource.id}`] = true
        included.push(resource)
      },

      /**
       * Return the included array in its current state
       * @return {Object[]}
       */
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
