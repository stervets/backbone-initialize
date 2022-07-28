(function() {
  var BackboneInitialize, BackbonePrepare, KEYS, KEY_LENGTH, arrayFromString, backboneInitialize, genId;

  KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  KEY_LENGTH = KEYS.length;

  this.BackbonePrepare = BackbonePrepare = [];

  this.BackboneLaunchStatus = {
    INIT: 0x0,
    PREPARE: 0x1,
    PREPARE_FAIL: 0x2,
    READY: 0x4
  };

  arrayFromString = function(string) {
    if (Array.isArray(string)) {
      return string;
    }
    return string.split(',').map(function(item) {
      return item.trim();
    });
  };

  genId = function(length = 16, id = '') {
    while (length-- > 0) {
      id += KEYS.charAt(Math.floor(Math.random() * KEY_LENGTH));
      if (!(!length || length % 4)) {
        id += '-';
      }
    }
    return id;
  };

  Backbone.BackboneInitializeNoWarnings = false;

  BackboneInitialize = (function() {
    class BackboneInitialize {
      warn(message) {
        if (!Backbone.BackboneInitializeNoWarnings) {
          return console.warn(`Backbone-initialize warn: ${message}`);
        }
      }

      getChild(path, event, parent = this.entity) {
        var child;
        child = path.shift();
        if (parent[child] != null) {
          if (path.length) {
            return this.getChild(path, event, parent[child]);
          } else {
            return parent[child];
          }
        } else {
          this.warn(`${child} undefined (this.${event})`);
          return null;
        }
      }

      eventHandler(handlerKey) {
        var handlers;
        handlers = this.handlers[handlerKey];
        return (...params) => {
          return this.executeChain(handlers, params);
        };
      }

      executeChain(chain, params, context = this.entity, result, notAFirstTime) {
        var fn, promise;
        params = params || [];
        if (notAFirstTime == null) {
          chain = chain.slice();
        }
        fn = chain.shift();
        promise = new Promise(async(resolve, reject) => {
          var e;
          try {
            await fn.apply(context, params.concat(result || []));
            if (chain.length) {
              return this.executeChain(chain, params, context, result, true);
            } else {
              return resolve.apply(context, params.concat(result || []));
            }
          } catch (error) {
            e = error;
            if (!Backbone.BackboneInitializeNoWarnings) {
              console.warn("Deferred chain fail", fn);
            }
            return reject.apply(context, params.concat(result || []));
          }
        });
        promise.fail = promise.catch;
        return promise;
      }

      addListener(subject, event, handler, context) {
        var handlerKey;
        if (subject._bbId == null) {
          subject._bbId = genId();
        }
        handlerKey = `${subject._bbId}-${event}`;
        if (this.handlers[handlerKey] == null) {
          this.handlers[handlerKey] = [];
          this.entity.listenTo(subject, event, this.eventHandler(handlerKey));
        }
        return this.handlers[handlerKey].push(handler.bind(context));
      }

      addHandler(events, handler, parent = this.entity) {
        var key, results, value;
        if (typeof events === 'object') {
          results = [];
          for (key in events) {
            value = events[key];
            results.push(this.addHandler(key, value, parent));
          }
          return results;
        } else {
          if (typeof handler === 'object' && !(Array.isArray(handler))) {
            arrayFromString(events).forEach((event) => {
              var child, results1, val;
              if ((child = this.getChild(event.split('.'), event, parent))) {
                results1 = [];
                for (key in handler) {
                  val = handler[key];
                  results1.push(this.addHandler(key, val, child));
                }
                return results1;
              } else {
                return this.warn(`Can't append handlers to ${event} cause child not found`);
              }
            });
            return;
          }
          if (typeof handler === 'string') {
            handler = arrayFromString(handler);
          }
          if (!Array.isArray(handler)) {
            handler = [handler];
          }
          handler = handler.slice();
          if (events[0] === '_') {
            events = handler.shift();
          }
          return arrayFromString(events).forEach((event) => {
            var eventParent, parentPath;
            eventParent = parent;
            parentPath = event.split('.');
            event = parentPath.pop();
            if (parentPath.length) {
              if (!(eventParent = this.getChild(parentPath, parentPath.join('.'), eventParent))) {
                return;
              }
            }
            return handler.forEach((handler) => {
              var child, handlerName, handlerParent;
              handlerName = false;
              handlerParent = this.entity;
              if (typeof handler === 'string') {
                handlerName = handler;
                child = handler.split('.');
                handler = child.pop();
                if (!(handlerParent = child.length ? this.getChild(child, handlerName) : this.entity)) {
                  return;
                }
                handler = handlerParent[handler];
              }
              if (typeof handler === 'function') {
                return this.addListener(eventParent, event, handler, handlerParent);
              } else {
                return this.warn(`Can't find handler for \"${event}\"` + (handlerName ? `: \"${handlerName}\"` : ''));
              }
            });
          });
        }
      }

      addHandlers() {
        if ((this.entity.handlers != null) && !this.entity.disableHandlers) {
          return this.addHandler(this.entity.handlers);
        }
      }

      launch(initHandlers, ...params) {
        if (initHandlers != null) {
          this.addHandlers();
        }
        this.entity.launchStatus = BackboneLaunchStatus.READY;
        return this.entity.trigger('launch', ...params);
      }

      prepareAndLaunch(params) {
        var base;
        this.entity.firstLaunch = this.prepares != null;
        if (BackbonePrepare.length || Array.isArray(this.entity.prepare)) {
          if (this.prepares == null) {
            (base = this.entity).prepare || (base.prepare = []);
            this.entity.prepare = BackbonePrepare.concat(this.entity.prepare);
            this.prepares = this.entity.prepare.map(((name) => {
              var prepareFunction;
              prepareFunction = typeof name === 'function' ? name : this.entity[name];
              if (typeof prepareFunction !== 'function') {
                this.warn(`Prepare item ${name} isn't function`);
                prepareFunction = $.noop;
              }
              return prepareFunction;
            }));
          }
          if (this.prepares.length) {
            this.entity.launchStatus = BackboneLaunchStatus.PREPARE;
            this.entity.promise = this.executeChain(this.prepares, params);
            this.entity.promise.then(() => {
              return this.launch(this.entity.firstLaunch, ...params);
            }).catch(() => {
              if (!Backbone.BackboneInitializeNoWarnings) {
                console.warn("Backbone initialize prepares fail: ", this.prepares);
              }
              this.entity.launchStatus = BackboneLaunchStatus.PREPARE_FAIL;
              if (typeof this.entity.onLaunchFail === 'function') {
                return this.entity.onLaunchFail(...params);
              }
            });
            return this.entity.promise;
          }
        }
        return this.launch(this.entity.firstLaunch, ...params);
      }

      constructor(entity) {
        var method, name, ref;
        this.entity = entity;
        if (this.entity.noBind == null) {
          ref = this.entity;
          for (name in ref) {
            method = ref[name];
            if (typeof method === 'function') {
              this.entity[name] = method.bind(this.entity);
            }
          }
        }
        this.entity.addHandler = this.addHandler.bind(this);
        this.entity.executeChain = this.executeChain.bind(this);
        this.handlers = {};
        this.entity.launchStatus = BackboneLaunchStatus.INIT;
      }

    };

    BackboneInitialize.prototype.handlers = null;

    BackboneInitialize.prototype.entity = null;

    BackboneInitialize.prototype.prepares = null;

    return BackboneInitialize;

  }).call(this);

  backboneInitialize = function(...params) {
    var name, object, options, ref;
    options = this.options;
    if (options == null) {
      options = params[1];
    }
    if (typeof this.prepare === 'string') {
      this.prepare = arrayFromString(this.prepare);
    }
    if (!(typeof this.handlers === 'object' || ((options != null ? options.attach : void 0) != null) || typeof this.launch === 'function' || Array.isArray(this.prepare))) {
      return;
    }
    this._bbInitialize = new BackboneInitialize(this);
    if (typeof this.launch === 'function') {
      this.addHandler('launch', this.launch);
    }
    if ((options != null ? options.attach : void 0) != null) {
      ref = options.attach;
      for (name in ref) {
        object = ref[name];
        this[name] = object;
      }
    }
    this.relaunch = () => {
      return this._bbInitialize.prepareAndLaunch(params);
    };
    return this.relaunch();
  };

  Backbone.Model.prototype.initialize = backboneInitialize;

  Backbone.Collection.prototype.initialize = backboneInitialize;

  Backbone.View.prototype.initialize = backboneInitialize;

  if (Backbone.NestedModel != null) {
    Backbone.NestedModel.prototype.initialize = backboneInitialize;
  }

  if (Backbone.Layout != null) {
    Backbone.Layout.prototype.initialize = backboneInitialize;
  }

  if (typeof Marionette !== "undefined" && Marionette !== null) {
    Marionette.Object.prototype.initialize = backboneInitialize;
  }

}).call(this);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtCQUFBLEVBQUEsZUFBQSxFQUFBLElBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLGtCQUFBLEVBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNJO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPO0VBSFA7O0VBTUosZUFBQSxHQUFrQixRQUFBLENBQUMsTUFBRCxDQUFBO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFFBQUEsQ0FBQyxJQUFELENBQUE7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFFBQUEsQ0FBQyxTQUFTLEVBQVYsRUFBYyxLQUFLLEVBQW5CLENBQUE7QUFDSixXQUFPLE1BQUEsRUFBQSxHQUFXLENBQWxCO01BQ0ksRUFBQSxJQUFNLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsVUFBM0IsQ0FBWjtNQUNOLE1BQWlCLENBQUMsTUFBRCxJQUFXLE1BQUEsR0FBUyxFQUFyQztRQUFBLEVBQUEsSUFBTSxJQUFOOztJQUZKO1dBR0E7RUFKSTs7RUFNUixRQUFRLENBQUMsNEJBQVQsR0FBd0M7O0VBRWxDO0lBQU4sTUFBQSxtQkFBQTtN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NEMsbUJBRGhEOzs7RUFHQSxJQUFHLHVCQUFIO0lBQ0ksUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBMUIsR0FBdUMsbUJBRDNDOzs7RUFHQSxJQUFHLHdEQUFIO0lBQ0ksVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBNUIsR0FBeUMsbUJBRDdDOztBQTNMQSIsInNvdXJjZXNDb250ZW50IjpbIktFWVMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMDEyMzQ1Njc4OVwiXG5LRVlfTEVOR1RIID0gS0VZUy5sZW5ndGg7XG5AQmFja2JvbmVQcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlID0gW11cblxuQEJhY2tib25lTGF1bmNoU3RhdHVzID1cbiAgICBJTklUOiAweDBcbiAgICBQUkVQQVJFOiAweDFcbiAgICBQUkVQQVJFX0ZBSUw6IDB4MlxuICAgIFJFQURZOiAweDRcblxuXG5hcnJheUZyb21TdHJpbmcgPSAoc3RyaW5nKS0+XG4gICAgcmV0dXJuIHN0cmluZyBpZiBBcnJheS5pc0FycmF5IHN0cmluZ1xuICAgIHN0cmluZy5zcGxpdCgnLCcpLm1hcCAoaXRlbSktPiBpdGVtLnRyaW0oKVxuXG5nZW5JZCA9IChsZW5ndGggPSAxNiwgaWQgPSAnJyktPlxuICAgIHdoaWxlIChsZW5ndGgtLSA+IDApXG4gICAgICAgIGlkICs9IEtFWVMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIEtFWV9MRU5HVEgpKVxuICAgICAgICBpZCArPSAnLScgdW5sZXNzICFsZW5ndGggb3IgbGVuZ3RoICUgNFxuICAgIGlkXG5cbkJhY2tib25lLkJhY2tib25lSW5pdGlhbGl6ZU5vV2FybmluZ3MgPSBmYWxzZVxuXG5jbGFzcyBCYWNrYm9uZUluaXRpYWxpemVcbiAgICBoYW5kbGVyczogbnVsbFxuICAgIGVudGl0eTogbnVsbFxuXG4gICAgd2FybjogKG1lc3NhZ2UpLT5cbiAgICAgICAgY29uc29sZS53YXJuKCBcIkJhY2tib25lLWluaXRpYWxpemUgd2FybjogI3ttZXNzYWdlfVwiKSB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgICAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgICAgICBpZiBwYXJlbnRbY2hpbGRdP1xuICAgICAgICAgICAgcmV0dXJuIGlmIHBhdGgubGVuZ3RoIHRoZW4gQGdldENoaWxkKHBhdGgsIGV2ZW50LCBwYXJlbnRbY2hpbGRdKSBlbHNlIHBhcmVudFtjaGlsZF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCIje2NoaWxkfSB1bmRlZmluZWQgKHRoaXMuI3tldmVudH0pXCJcbiAgICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICBldmVudEhhbmRsZXI6IChoYW5kbGVyS2V5KS0+XG4gICAgICAgIGhhbmRsZXJzID0gQGhhbmRsZXJzW2hhbmRsZXJLZXldXG4gICAgICAgIChwYXJhbXMuLi4pPT5cbiAgICAgICAgICAgIEBleGVjdXRlQ2hhaW4gaGFuZGxlcnMsIHBhcmFtc1xuXG4gICAgZXhlY3V0ZUNoYWluOiAoY2hhaW4sIHBhcmFtcywgY29udGV4dCA9IEBlbnRpdHksIHJlc3VsdCwgbm90QUZpcnN0VGltZSktPlxuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgb3IgW11cbiAgICAgICAgY2hhaW4gPSBjaGFpbi5zbGljZSgpIHVubGVzcyBub3RBRmlyc3RUaW1lP1xuXG4gICAgICAgIGZuID0gY2hhaW4uc2hpZnQoKVxuXG4gICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KT0+XG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBhd2FpdCBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSkpXG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgQGV4ZWN1dGVDaGFpbiBjaGFpbiwgcGFyYW1zLCBjb250ZXh0LCByZXN1bHQsIHRydWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgcmVzb2x2ZS5hcHBseSBjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSlcbiAgICAgICAgICBjYXRjaCBlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJEZWZlcnJlZCBjaGFpbiBmYWlsXCIsIGZuKSAgdW5sZXNzIEJhY2tib25lLkJhY2tib25lSW5pdGlhbGl6ZU5vV2FybmluZ3NcbiAgICAgICAgICAgIHJlamVjdC5hcHBseSBjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSlcblxuICAgICAgICBwcm9taXNlLmZhaWwgPSBwcm9taXNlLmNhdGNoXG4gICAgICAgIHByb21pc2VcblxuICAgIGFkZExpc3RlbmVyOiAoc3ViamVjdCwgZXZlbnQsIGhhbmRsZXIsIGNvbnRleHQpLT5cbiAgICAgICAgc3ViamVjdC5fYmJJZCA9IGdlbklkKCkgdW5sZXNzIHN1YmplY3QuX2JiSWQ/XG4gICAgICAgIGhhbmRsZXJLZXkgPSBcIiN7c3ViamVjdC5fYmJJZH0tI3tldmVudH1cIlxuICAgICAgICB1bmxlc3MgQGhhbmRsZXJzW2hhbmRsZXJLZXldP1xuICAgICAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldID0gW11cbiAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gc3ViamVjdCwgZXZlbnQsIEBldmVudEhhbmRsZXIoaGFuZGxlcktleSlcbiAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldLnB1c2ggaGFuZGxlci5iaW5kKGNvbnRleHQpXG5cblxuICAgIGFkZEhhbmRsZXI6IChldmVudHMsIGhhbmRsZXIsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgaWYgdHlwZW9mIGV2ZW50cyBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgIGV2ZW50UGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChldmVudFBhcmVudCA9IEBnZXRDaGlsZChwYXJlbnRQYXRoLCBwYXJlbnRQYXRoLmpvaW4oJy4nKSwgZXZlbnRQYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRMaXN0ZW5lciBldmVudFBhcmVudCwgZXZlbnQsIGhhbmRsZXIsIGhhbmRsZXJQYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKGluaXRIYW5kbGVycywgcGFyYW1zLi4uKS0+XG4gICAgICAgIEBhZGRIYW5kbGVycygpIGlmIGluaXRIYW5kbGVycz9cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5SRUFEWVxuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgcHJlcGFyZXM6IG51bGxcblxuICAgIHByZXBhcmVBbmRMYXVuY2g6IChwYXJhbXMpLT5cbiAgICAgICAgQGVudGl0eS5maXJzdExhdW5jaCA9IEBwcmVwYXJlcz9cblxuICAgICAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQGVudGl0eS5wcmVwYXJlXG4gICAgICAgICAgICB1bmxlc3MgQHByZXBhcmVzP1xuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSB8fD0gW11cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBlbnRpdHkucHJlcGFyZVxuXG4gICAgICAgICAgICAgICAgQHByZXBhcmVzID0gQGVudGl0eS5wcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAZW50aXR5W25hbWVdXG4gICAgICAgICAgICAgICAgICAgIHVubGVzcyB0eXBlb2YgcHJlcGFyZUZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiUHJlcGFyZSBpdGVtICN7bmFtZX0gaXNuJ3QgZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb25cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgIGlmIEBwcmVwYXJlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2UgPSBAZXhlY3V0ZUNoYWluKEBwcmVwYXJlcywgcGFyYW1zKVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKD0+XG4gICAgICAgICAgICAgICAgICAgIEBsYXVuY2ggQGVudGl0eS5maXJzdExhdW5jaCwgcGFyYW1zLi4uXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5jYXRjaCg9PlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpICB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuICAgICAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVfRkFJTFxuICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lm9uTGF1bmNoRmFpbCBwYXJhbXMuLi4gaWYgdHlwZW9mIEBlbnRpdHkub25MYXVuY2hGYWlsIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIHVubGVzcyBAZW50aXR5Lm5vQmluZD9cbiAgICAgICAgICAgIGZvciBuYW1lLCBtZXRob2Qgb2YgQGVudGl0eSB3aGVuIHR5cGVvZiBtZXRob2QgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICAgICAgQGVudGl0eS5hZGRIYW5kbGVyID0gQGFkZEhhbmRsZXIuYmluZCBAXG4gICAgICAgIEBlbnRpdHkuZXhlY3V0ZUNoYWluID0gQGV4ZWN1dGVDaGFpbi5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5JTklUXG5cbmJhY2tib25lSW5pdGlhbGl6ZSA9IChwYXJhbXMuLi4pLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFyYW1zWzFdIHVubGVzcyBvcHRpb25zP1xuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIEByZWxhdW5jaCA9ID0+XG4gICAgICAgIEBfYmJJbml0aWFsaXplLnByZXBhcmVBbmRMYXVuY2ggcGFyYW1zXG4gICAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
