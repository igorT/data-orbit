import OrbitStore from '@orbit/store';
import { buildTransform } from '@orbit/data';
import { settleInSeries } from '@orbit/core';

export default class SyncStore extends OrbitStore {

  immediateUpdate(transformOrOperations, options, id) {
    const transform = buildTransform(transformOrOperations, options, id, this.transformBuilder);

    if (this.transformLog.contains(transform.id)) {
      return;
    }

    return this._update(transform).then(result => {
      return this._transformed([transform])
        .then(() => settleInSeries(this, 'update', transform, result))
        .then(() => result);
    }).catch(error => {
      return settleInSeries(this, 'updateFail', transform, error)
        .then(() => { throw error; });
    });
  }

  fork(settings) {
    if (!settings) {
      settings = {};
    }
    settings.schema = this._schema;
    settings.cacheSettings = settings.cacheSettings || {};
    settings.cacheSettings.base = this._cache;
    settings.keyMap = this._keyMap;
    settings.queryBuilder = this.queryBuilder;
    settings.transformBuilder = this.transformBuilder;

    return new SyncStore(settings);
  }

}
