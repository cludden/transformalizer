/**
 * isFunction borrowed from underscore.js
 * @param  {*} object
 * @return {Boolean}
 * @private
 */
export function isFunction(object) {
  return !!(object && object.constructor && object.call && object.apply)
}

/**
 * Determine if a variable is a string
 * @param  {*} val
 * @return {Boolean}
 * @private
 */
export function isString(val) {
  return typeof val === 'string'
}

/**
 * Determine if a variable is plain old javascript object (non array, non null, non date)
 * @param  {*} object
 * @return {Boolean}
 */
export function isObject(object) {
  return object && typeof object === 'object' && !Array.isArray(object) && !(object instanceof Date)
}

/**
 * Transform Error Constructor
 * @param {String} msg
 * @param {Object} args
 */
export function TransformError(msg, args) {
  this.constructor.prototype.__proto__ = Error.prototype // eslint-disable-line
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = msg
  this.args = args
}

/**
 * Validate a schema definition
 * @param  {Object} args
 * @param  {String} args.name - schema name/id
 * @param  {Object} args.schema - schema definition
 * @return {Object} validated
 * @private
 */
export function validateSchema({ name, schema = {} }) {
  if (!isObject(schema)) {
    throw new Error('Invalid "schema" Property')
  }
  if (!isObject(schema.data)) {
    schema.data = {}
  }
  // validate untransform dataSchema
  if (schema.data.untransformDataSchema && !isFunction(schema.data.untransformDataSchema)) {
    throw new Error('Invalid "schema.data.untransformDataSchema" Property')
  }
  // validate id
  if (!isFunction(schema.data.id)) {
    schema.data.id = function getId({ data }) {
      return data.id.toString()
    }
  }
  // validate untransform id
  if (schema.data.untransformId && !isFunction(schema.data.untransformId)) {
    throw new Error('Invalid "schema.data.untransformId" Property')
  }
  // validate type
  if (!isFunction(schema.data.type)) {
    schema.data.type = function type() { return name }
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
  // validate untransform attributes
  if (schema.data.untransformAttributes && !isFunction(schema.data.untransformAttributes)) {
    throw new Error('Invalid "schema.data.untransformAttributes" Property')
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
  // validate top level links
  if (schema.links && !isFunction(schema.links)) {
    throw new Error('Invalid "schema.links" Property')
  }
  // validate top level meta
  if (schema.meta && !isFunction(schema.meta)) {
    throw new Error('Invalid "schema.meta" Property')
  }
  return schema
}

/**
 * Validate a json-api document
 * @param  {Object} document - an object in json-api format
 * @private
 */
export function validateJsonApiDocument(document) {
  // validate top level JSON-API document
  if (!isObject(document)) {
    throw new Error('JSON-API document must be an object')
  }

  if (!document.data && !document.errors && !document.meta) {
    throw new Error('JSON-API document must contain at least one of "data", "errors", or "meta"')
  }

  if (document.data && document.errors) {
    throw new Error('JSON-API document must not contain both "data" and "errors"')
  }

  if (!document.data && document.included) {
    throw new Error('JSON-API document cannot contain "included" without "data"')
  }

  if (document.data) {
    let resources

    if (!Array.isArray(document.data)) {
      resources = [document.data]
    } else {
      resources = document.data
    }

    // validate primary resources
    resources.forEach((resource) => {
      // validate id
      if (resource.id && !isString(resource.id)) {
        throw new Error(`Primary data resource id "${resource.id}" must be a string`)
      }

      // validate type
      if (!resource.type) {
        throw new Error(`Primary data resource "${resource.id}" must have a "type" field`)
      }

      if (!isString(resource.type)) {
        throw new Error(`Primary data resource type "${resource.type}" must be a string`)
      }

      // validate attributes
      if (resource.attributes && !isObject(resource.attributes)) {
        throw new Error(`Primary data resource "${resource.id}, ${resource.type}" field "attributes" must be an object`)
      }

      // validate relationships
      if (resource.relationships) {
        if (!isObject(resource.relationships)) {
          throw new Error(`Primary data resource "${resource.id}, ${resource.type}" field "relationships" must be an object`)
        }

        Object.keys(resource.relationships).forEach((relationshipName) => {
          const relationship = resource.relationships[relationshipName]

          if (!relationship.data) {
            throw new Error(`Relationship "${relationshipName}" of primary data resource "${resource.id}, ${resource.type}" must have a "data" field`)
          }

          let data

          if (!Array.isArray(relationship.data)) {
            data = [relationship.data]
          } else {
            data = relationship.data
          }

          data.forEach((d) => {
            if (!d.id) {
              throw new Error(`Data of relationship "${relationshipName}" of primary data resource "${resource.id}, ${resource.type}" must have an "id" field`)
            }

            if (!isString(d.id)) {
              throw new Error(`Data "${d.id}" of relationship "${relationshipName}" of primary data resource "${resource.id}, ${resource.type}" must be a string`)
            }

            if (!d.type) {
              throw new Error(`Data "${d.id}" of relationship "${relationshipName}" of primary data resource "${resource.id}, ${resource.type}" must have a "type" field`)
            }

            if (!isString(d.type)) {
              throw new Error(`Type "${d.type}" of relationship "${relationshipName}" of primary data resource "${resource.id}, ${resource.type}" must be a string`)
            }
          })
        })
      }
    })
  }

  if (document.included) {
    if (!Array.isArray(document.included)) {
      throw new Error('JSON-API document property "included" must be array')
    }

    // validate included resources
    document.included.forEach((resource) => {
      // validate id
      if (!resource.id) {
        throw new Error('Included data resource must have an "id" field')
      }

      if (!isString(resource.id)) {
        throw new Error(`Included data resource id "${resource.id}" must be a string`)
      }

      // validate type
      if (!resource.type) {
        throw new Error(`Included data resource "${resource.id}" must have a "type" field`)
      }

      if (!isString(resource.type)) {
        throw new Error(`Included data resource type "${resource.type}" must be a string`)
      }

      // validate attributes
      if (resource.attributes && !isObject(resource.attributes)) {
        throw new Error(`Included data resource "${resource.id}, ${resource.type}" field "attributes" must be an object`)
      }

      // validate relationships
      if (resource.relationships) {
        if (!isObject(resource.relationships)) {
          throw new Error(`Included data resource "${resource.id}, ${resource.type}" field "relationships" must be an object`)
        }

        Object.keys(resource.relationships).forEach((relationshipName) => {
          const relationship = resource.relationships[relationshipName]

          if (!relationship.data) {
            throw new Error(`Relationship "${relationshipName}" of included data resource "${resource.id}, ${resource.type}" must have a "data" field`)
          }

          let data

          if (!Array.isArray(relationship.data)) {
            data = [relationship.data]
          } else {
            data = relationship.data
          }

          data.forEach((d) => {
            if (!d.id) {
              throw new Error(`Data of relationship "${relationshipName}" of included data resource "${resource.id}, ${resource.type}" must have an "id" field`)
            }

            if (!isString(d.id)) {
              throw new Error(`Data "${d.id}" of relationship "${relationshipName}" of included data resource "${resource.id}, ${resource.type}" must be a string`)
            }

            if (!d.type) {
              throw new Error(`Data "${d.id}" of relationship "${relationshipName}" of included data resource "${resource.id}, ${resource.type}" must have a "type" field`)
            }

            if (!isString(d.type)) {
              throw new Error(`Type "${d.type}" of relationship "${relationshipName}" of included data resource "${resource.id}, ${resource.type}" must be a string`)
            }
          })
        })
      }
    })
  }
}
