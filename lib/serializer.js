import Bluebird from 'bluebird';
import R from 'ramda';

export default class Serializer {
  constructor(options) {
    this._options = options;
    this._registry = {};
  }

  register({ type, schema, options }) {

  }
}
