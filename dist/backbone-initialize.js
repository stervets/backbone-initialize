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

      executeChain(chain, params, context = this.entity, defer, result) {
        var deferPromise, promise;
        params = params || [];
        if (defer == null) {
          defer = $.Deferred();
          chain = chain.slice();
          deferPromise = defer.promise();
          deferPromise.defer = defer;
        }
        promise = chain.shift();
        return new Promise(async(resolve, reject) => {
          var e;
          try {
            await promise.apply(context, params.concat(result || []));
            if (chain.length) {
              return this.executeChain(chain, params, context, defer, result);
            } else {
              return resolve.apply(context, params.concat(result || []));
            }
          } catch (error) {
            e = error;
            if (!Backbone.BackboneInitializeNoWarnings) {
              console.warn("Deferred chain fail", promise);
            }
            return reject.apply(context, params.concat(result || []));
          }
        });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtCQUFBLEVBQUEsZUFBQSxFQUFBLElBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLGtCQUFBLEVBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNJO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPO0VBSFA7O0VBTUosZUFBQSxHQUFrQixRQUFBLENBQUMsTUFBRCxDQUFBO0lBQ2QsSUFBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxNQUFkLENBQWpCO0FBQUEsYUFBTyxPQUFQOztXQUNBLE1BQU0sQ0FBQyxLQUFQLENBQWEsR0FBYixDQUFpQixDQUFDLEdBQWxCLENBQXNCLFFBQUEsQ0FBQyxJQUFELENBQUE7YUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO0lBQVQsQ0FBdEI7RUFGYzs7RUFJbEIsS0FBQSxHQUFRLFFBQUEsQ0FBQyxTQUFTLEVBQVYsRUFBYyxLQUFLLEVBQW5CLENBQUE7QUFDSixXQUFPLE1BQUEsRUFBQSxHQUFXLENBQWxCO01BQ0ksRUFBQSxJQUFNLElBQUksQ0FBQyxNQUFMLENBQVksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBZ0IsVUFBM0IsQ0FBWjtNQUNOLE1BQWlCLENBQUMsTUFBRCxJQUFXLE1BQUEsR0FBUyxFQUFyQztRQUFBLEVBQUEsSUFBTSxJQUFOOztJQUZKO1dBR0E7RUFKSTs7RUFNUixRQUFRLENBQUMsNEJBQVQsR0FBd0M7O0VBRWxDO0lBQU4sTUFBQSxtQkFBQTtN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SSxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUEvQixHQUE0QyxtQkFEaEQ7OztFQUdBLElBQUcsdUJBQUg7SUFDSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUExQixHQUF1QyxtQkFEM0M7OztFQUdBLElBQUcsd0RBQUg7SUFDSSxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUE1QixHQUF5QyxtQkFEN0M7O0FBNUxBIiwic291cmNlc0NvbnRlbnQiOlsiS0VZUyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5XCJcbktFWV9MRU5HVEggPSBLRVlTLmxlbmd0aDtcbkBCYWNrYm9uZVByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUgPSBbXVxuXG5AQmFja2JvbmVMYXVuY2hTdGF0dXMgPVxuICAgIElOSVQ6IDB4MFxuICAgIFBSRVBBUkU6IDB4MVxuICAgIFBSRVBBUkVfRkFJTDogMHgyXG4gICAgUkVBRFk6IDB4NFxuXG5cbmFycmF5RnJvbVN0cmluZyA9IChzdHJpbmcpLT5cbiAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgc3RyaW5nLnNwbGl0KCcsJykubWFwIChpdGVtKS0+IGl0ZW0udHJpbSgpXG5cbmdlbklkID0gKGxlbmd0aCA9IDE2LCBpZCA9ICcnKS0+XG4gICAgd2hpbGUgKGxlbmd0aC0tID4gMClcbiAgICAgICAgaWQgKz0gS0VZUy5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogS0VZX0xFTkdUSCkpXG4gICAgICAgIGlkICs9ICctJyB1bmxlc3MgIWxlbmd0aCBvciBsZW5ndGggJSA0XG4gICAgaWRcblxuQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5ncyA9IGZhbHNlXG5cbmNsYXNzIEJhY2tib25lSW5pdGlhbGl6ZVxuICAgIGhhbmRsZXJzOiBudWxsXG4gICAgZW50aXR5OiBudWxsXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4oIFwiQmFja2JvbmUtaW5pdGlhbGl6ZSB3YXJuOiAje21lc3NhZ2V9XCIpIHVubGVzcyBCYWNrYm9uZS5CYWNrYm9uZUluaXRpYWxpemVOb1dhcm5pbmdzXG5cbiAgICBnZXRDaGlsZDogKHBhdGgsIGV2ZW50LCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGNoaWxkID0gcGF0aC5zaGlmdCgpXG4gICAgICAgIGlmIHBhcmVudFtjaGlsZF0/XG4gICAgICAgICAgICByZXR1cm4gaWYgcGF0aC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQocGF0aCwgZXZlbnQsIHBhcmVudFtjaGlsZF0pIGVsc2UgcGFyZW50W2NoaWxkXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd2FybiBcIiN7Y2hpbGR9IHVuZGVmaW5lZCAodGhpcy4je2V2ZW50fSlcIlxuICAgICAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIGV2ZW50SGFuZGxlcjogKGhhbmRsZXJLZXkpLT5cbiAgICAgICAgaGFuZGxlcnMgPSBAaGFuZGxlcnNbaGFuZGxlcktleV1cbiAgICAgICAgKHBhcmFtcy4uLik9PlxuICAgICAgICAgICAgQGV4ZWN1dGVDaGFpbiBoYW5kbGVycywgcGFyYW1zXG5cbiAgICBleGVjdXRlQ2hhaW46IChjaGFpbiwgcGFyYW1zLCBjb250ZXh0ID0gQGVudGl0eSwgZGVmZXIsIHJlc3VsdCktPlxuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgb3IgW11cbiAgICAgICAgdW5sZXNzIGRlZmVyP1xuICAgICAgICAgICAgZGVmZXIgPSAkLkRlZmVycmVkKClcbiAgICAgICAgICAgIGNoYWluID0gY2hhaW4uc2xpY2UoKVxuICAgICAgICAgICAgZGVmZXJQcm9taXNlID0gZGVmZXIucHJvbWlzZSgpXG4gICAgICAgICAgICBkZWZlclByb21pc2UuZGVmZXIgPSBkZWZlclxuXG4gICAgICAgIHByb21pc2UgPSBjaGFpbi5zaGlmdCgpXG5cbiAgICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCk9PlxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgYXdhaXQgcHJvbWlzZS5hcHBseShjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSkpXG4gICAgICAgICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgICAgICAgQGV4ZWN1dGVDaGFpbiBjaGFpbiwgcGFyYW1zLCBjb250ZXh0LCBkZWZlciwgcmVzdWx0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHJlc29sdmUuYXBwbHkgY29udGV4dCwgcGFyYW1zLmNvbmNhdChyZXN1bHQgb3IgW10pXG4gICAgICAgICAgY2F0Y2ggZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRGVmZXJyZWQgY2hhaW4gZmFpbFwiLCBwcm9taXNlKSAgdW5sZXNzIEJhY2tib25lLkJhY2tib25lSW5pdGlhbGl6ZU5vV2FybmluZ3NcbiAgICAgICAgICAgIHJlamVjdC5hcHBseSBjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSlcblxuICAgIGFkZExpc3RlbmVyOiAoc3ViamVjdCwgZXZlbnQsIGhhbmRsZXIsIGNvbnRleHQpLT5cbiAgICAgICAgc3ViamVjdC5fYmJJZCA9IGdlbklkKCkgdW5sZXNzIHN1YmplY3QuX2JiSWQ/XG4gICAgICAgIGhhbmRsZXJLZXkgPSBcIiN7c3ViamVjdC5fYmJJZH0tI3tldmVudH1cIlxuICAgICAgICB1bmxlc3MgQGhhbmRsZXJzW2hhbmRsZXJLZXldP1xuICAgICAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldID0gW11cbiAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gc3ViamVjdCwgZXZlbnQsIEBldmVudEhhbmRsZXIoaGFuZGxlcktleSlcbiAgICAgICAgQGhhbmRsZXJzW2hhbmRsZXJLZXldLnB1c2ggaGFuZGxlci5iaW5kKGNvbnRleHQpXG5cblxuICAgIGFkZEhhbmRsZXI6IChldmVudHMsIGhhbmRsZXIsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgaWYgdHlwZW9mIGV2ZW50cyBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIGhhbmRsZXIgPSBhcnJheUZyb21TdHJpbmcgaGFuZGxlciBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXSB1bmxlc3MgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpXG4gICAgICAgICAgICBldmVudHMgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRzWzBdIGlzICdfJ1xuXG4gICAgICAgICAgICBhcnJheUZyb21TdHJpbmcoZXZlbnRzKS5mb3JFYWNoIChldmVudCk9PlxuICAgICAgICAgICAgICAgIGV2ZW50UGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChldmVudFBhcmVudCA9IEBnZXRDaGlsZChwYXJlbnRQYXRoLCBwYXJlbnRQYXRoLmpvaW4oJy4nKSwgZXZlbnRQYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRMaXN0ZW5lciBldmVudFBhcmVudCwgZXZlbnQsIGhhbmRsZXIsIGhhbmRsZXJQYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKGluaXRIYW5kbGVycywgcGFyYW1zLi4uKS0+XG4gICAgICAgIEBhZGRIYW5kbGVycygpIGlmIGluaXRIYW5kbGVycz9cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5SRUFEWVxuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgcHJlcGFyZXM6IG51bGxcblxuICAgIHByZXBhcmVBbmRMYXVuY2g6IChwYXJhbXMpLT5cbiAgICAgICAgQGVudGl0eS5maXJzdExhdW5jaCA9IEBwcmVwYXJlcz9cblxuICAgICAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQGVudGl0eS5wcmVwYXJlXG4gICAgICAgICAgICB1bmxlc3MgQHByZXBhcmVzP1xuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJlcGFyZSB8fD0gW11cbiAgICAgICAgICAgICAgICBAZW50aXR5LnByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBlbnRpdHkucHJlcGFyZVxuXG4gICAgICAgICAgICAgICAgQHByZXBhcmVzID0gQGVudGl0eS5wcmVwYXJlLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAZW50aXR5W25hbWVdXG4gICAgICAgICAgICAgICAgICAgIHVubGVzcyB0eXBlb2YgcHJlcGFyZUZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiUHJlcGFyZSBpdGVtICN7bmFtZX0gaXNuJ3QgZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb25cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgIGlmIEBwcmVwYXJlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVcbiAgICAgICAgICAgICAgICBAZW50aXR5LnByb21pc2UgPSBAZXhlY3V0ZUNoYWluKEBwcmVwYXJlcywgcGFyYW1zKVxuICAgICAgICAgICAgICAgIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKD0+XG4gICAgICAgICAgICAgICAgICAgIEBsYXVuY2ggQGVudGl0eS5maXJzdExhdW5jaCwgcGFyYW1zLi4uXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5jYXRjaCg9PlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpICB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuICAgICAgICAgICAgICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVfRkFJTFxuICAgICAgICAgICAgICAgICAgICBAZW50aXR5Lm9uTGF1bmNoRmFpbCBwYXJhbXMuLi4gaWYgdHlwZW9mIEBlbnRpdHkub25MYXVuY2hGYWlsIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBlbnRpdHkucHJvbWlzZVxuICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIHVubGVzcyBAZW50aXR5Lm5vQmluZD9cbiAgICAgICAgICAgIGZvciBuYW1lLCBtZXRob2Qgb2YgQGVudGl0eSB3aGVuIHR5cGVvZiBtZXRob2QgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICAgICAgQGVudGl0eS5hZGRIYW5kbGVyID0gQGFkZEhhbmRsZXIuYmluZCBAXG4gICAgICAgIEBlbnRpdHkuZXhlY3V0ZUNoYWluID0gQGV4ZWN1dGVDaGFpbi5iaW5kIEBcbiAgICAgICAgQGhhbmRsZXJzID0ge31cbiAgICAgICAgQGVudGl0eS5sYXVuY2hTdGF0dXMgPSBCYWNrYm9uZUxhdW5jaFN0YXR1cy5JTklUXG5cbmJhY2tib25lSW5pdGlhbGl6ZSA9IChwYXJhbXMuLi4pLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFyYW1zWzFdIHVubGVzcyBvcHRpb25zP1xuICAgIEBwcmVwYXJlID0gYXJyYXlGcm9tU3RyaW5nKEBwcmVwYXJlKSBpZiB0eXBlb2YgQHByZXBhcmUgaXMgJ3N0cmluZydcbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gICAgQF9iYkluaXRpYWxpemUgPSBuZXcgQmFja2JvbmVJbml0aWFsaXplIEBcbiAgICBAYWRkSGFuZGxlcignbGF1bmNoJywgQGxhdW5jaCkgaWYgdHlwZW9mIEBsYXVuY2ggaXMgJ2Z1bmN0aW9uJ1xuXG4gICAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgICAgICBAW25hbWVdID0gb2JqZWN0IGZvciBuYW1lLCBvYmplY3Qgb2Ygb3B0aW9ucy5hdHRhY2hcblxuICAgIEByZWxhdW5jaCA9ID0+XG4gICAgICAgIEBfYmJJbml0aWFsaXplLnByZXBhcmVBbmRMYXVuY2ggcGFyYW1zXG4gICAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gICAgQmFja2JvbmUuTmVzdGVkTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
