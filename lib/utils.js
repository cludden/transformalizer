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
export function validateSchema({ name, schema }) {
  if (!isObject(schema) || !schema.data) {
    throw new Error('Invalid "schema" Property')
  }
  if (!isObject(schema.data)) {
    throw new Error('Invalid "schema.data" Property')
  }
  // validate id
  if (!isFunction(schema.data.id)) {
    schema.id = ({ id }) => id
  }
  // validate type
  if (!isFunction(schema.data.type)) {
    schema.type = function type() { return name }
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
