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
        $.when(promise.apply(context, params.concat(result || []))).done((...result) => {}, chain.length ? this.executeChain(chain, params, context, defer, result) : defer.resolve.apply(context, params.concat(result || []))).fail(function(...result) {}, !Backbone.BackboneInitializeNoWarnings ? console.warn("Deferred chain fail", promise) : void 0, defer.reject.apply(context, params.concat(result || [])));
        return deferPromise;
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
            this.entity.promise.done(() => {}, this.launch(this.entity.firstLaunch, ...params)).fail(() => {}, !Backbone.BackboneInitializeNoWarnings ? console.warn("Backbone initialize prepares fail: ", this.prepares) : void 0, this.entity.launchStatus = BackboneLaunchStatus.PREPARE_FAIL, typeof this.entity.onLaunchFail === 'function' ? this.entity.onLaunchFail(...params) : void 0);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2JvbmUtaW5pdGlhbGl6ZS5qcyIsInNvdXJjZXMiOlsiYmFja2JvbmUtaW5pdGlhbGl6ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtCQUFBLEVBQUEsZUFBQSxFQUFBLElBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLGtCQUFBLEVBQUE7O0VBQUEsSUFBQSxHQUFPOztFQUNQLFVBQUEsR0FBYSxJQUFJLENBQUM7O0VBQ2xCLElBQUMsQ0FBQSxlQUFELEdBQW1CLGVBQUEsR0FBa0I7O0VBRXJDLElBQUMsQ0FBQSxvQkFBRCxHQUNFO0lBQUEsSUFBQSxFQUFNLEdBQU47SUFDQSxPQUFBLEVBQVMsR0FEVDtJQUVBLFlBQUEsRUFBYyxHQUZkO0lBR0EsS0FBQSxFQUFPO0VBSFA7O0VBTUYsZUFBQSxHQUFrQixRQUFBLENBQUMsTUFBRCxDQUFBO0lBQ2hCLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGFBQU8sT0FBUDs7V0FDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixRQUFBLENBQUMsSUFBRCxDQUFBO2FBQVMsSUFBSSxDQUFDLElBQUwsQ0FBQTtJQUFULENBQXRCO0VBRmdCOztFQUlsQixLQUFBLEdBQVEsUUFBQSxDQUFDLFNBQVMsRUFBVixFQUFjLEtBQUssRUFBbkIsQ0FBQTtBQUNOLFdBQU8sTUFBQSxFQUFBLEdBQVcsQ0FBbEI7TUFDRSxFQUFBLElBQU0sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUksQ0FBQyxNQUFMLENBQUEsQ0FBQSxHQUFnQixVQUEzQixDQUFaO01BQ04sTUFBaUIsQ0FBQyxNQUFELElBQVcsTUFBQSxHQUFTLEVBQXJDO1FBQUEsRUFBQSxJQUFNLElBQU47O0lBRkY7V0FHQTtFQUpNOztFQU1SLFFBQVEsQ0FBQyw0QkFBVCxHQUF3Qzs7RUFFbEM7SUFBTixNQUFBLG1CQUFB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SUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUF4QixHQUFxQzs7RUFFckMsSUFBRyw0QkFBSDtJQUNFLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQS9CLEdBQTRDLG1CQUQ5Qzs7O0VBR0EsSUFBRyx1QkFBSDtJQUNFLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTFCLEdBQXVDLG1CQUR6Qzs7O0VBR0EsSUFBRyx3REFBSDtJQUNFLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQTVCLEdBQXlDLG1CQUQzQzs7QUE5TEEiLCJzb3VyY2VzQ29udGVudCI6WyJLRVlTID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlcIlxuS0VZX0xFTkdUSCA9IEtFWVMubGVuZ3RoO1xuQEJhY2tib25lUHJlcGFyZSA9IEJhY2tib25lUHJlcGFyZSA9IFtdXG5cbkBCYWNrYm9uZUxhdW5jaFN0YXR1cyA9XG4gIElOSVQ6IDB4MFxuICBQUkVQQVJFOiAweDFcbiAgUFJFUEFSRV9GQUlMOiAweDJcbiAgUkVBRFk6IDB4NFxuXG5cbmFycmF5RnJvbVN0cmluZyA9IChzdHJpbmcpLT5cbiAgcmV0dXJuIHN0cmluZyBpZiBBcnJheS5pc0FycmF5IHN0cmluZ1xuICBzdHJpbmcuc3BsaXQoJywnKS5tYXAgKGl0ZW0pLT4gaXRlbS50cmltKClcblxuZ2VuSWQgPSAobGVuZ3RoID0gMTYsIGlkID0gJycpLT5cbiAgd2hpbGUgKGxlbmd0aC0tID4gMClcbiAgICBpZCArPSBLRVlTLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBLRVlfTEVOR1RIKSlcbiAgICBpZCArPSAnLScgdW5sZXNzICFsZW5ndGggb3IgbGVuZ3RoICUgNFxuICBpZFxuXG5CYWNrYm9uZS5CYWNrYm9uZUluaXRpYWxpemVOb1dhcm5pbmdzID0gZmFsc2VcblxuY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gIGhhbmRsZXJzOiBudWxsXG4gIGVudGl0eTogbnVsbFxuXG4gIHdhcm46IChtZXNzYWdlKS0+XG4gICAgY29uc29sZS53YXJuKCBcIkJhY2tib25lLWluaXRpYWxpemUgd2FybjogI3ttZXNzYWdlfVwiKSB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuXG4gIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICBjaGlsZCA9IHBhdGguc2hpZnQoKVxuICAgIGlmIHBhcmVudFtjaGlsZF0/XG4gICAgICByZXR1cm4gaWYgcGF0aC5sZW5ndGggdGhlbiBAZ2V0Q2hpbGQocGF0aCwgZXZlbnQsIHBhcmVudFtjaGlsZF0pIGVsc2UgcGFyZW50W2NoaWxkXVxuICAgIGVsc2VcbiAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICByZXR1cm4gbnVsbFxuXG4gIGV2ZW50SGFuZGxlcjogKGhhbmRsZXJLZXkpLT5cbiAgICBoYW5kbGVycyA9IEBoYW5kbGVyc1toYW5kbGVyS2V5XVxuICAgIChwYXJhbXMuLi4pPT5cbiAgICAgIEBleGVjdXRlQ2hhaW4gaGFuZGxlcnMsIHBhcmFtc1xuXG4gIGV4ZWN1dGVDaGFpbjogKGNoYWluLCBwYXJhbXMsIGNvbnRleHQgPSBAZW50aXR5LCBkZWZlciwgcmVzdWx0KS0+XG4gICAgcGFyYW1zID0gcGFyYW1zIG9yIFtdXG4gICAgdW5sZXNzIGRlZmVyP1xuICAgICAgZGVmZXIgPSAkLkRlZmVycmVkKClcbiAgICAgIGNoYWluID0gY2hhaW4uc2xpY2UoKVxuICAgICAgZGVmZXJQcm9taXNlID0gZGVmZXIucHJvbWlzZSgpXG4gICAgICBkZWZlclByb21pc2UuZGVmZXIgPSBkZWZlclxuXG4gICAgcHJvbWlzZSA9IGNoYWluLnNoaWZ0KClcblxuICAgICQud2hlbihwcm9taXNlLmFwcGx5KGNvbnRleHQsIHBhcmFtcy5jb25jYXQocmVzdWx0IG9yIFtdKSkpXG4gICAgICAuZG9uZSgocmVzdWx0Li4uKT0+XG4gICAgICBpZiBjaGFpbi5sZW5ndGhcbiAgICAgICAgQGV4ZWN1dGVDaGFpbiBjaGFpbiwgcGFyYW1zLCBjb250ZXh0LCBkZWZlciwgcmVzdWx0XG4gICAgICBlbHNlXG4gICAgICAgIGRlZmVyLnJlc29sdmUuYXBwbHkgY29udGV4dCwgcGFyYW1zLmNvbmNhdChyZXN1bHQgb3IgW10pXG4gICAgKVxuICAgICAgLmZhaWwoKHJlc3VsdC4uLiktPlxuICAgICAgY29uc29sZS53YXJuKFwiRGVmZXJyZWQgY2hhaW4gZmFpbFwiLCBwcm9taXNlKSAgdW5sZXNzIEJhY2tib25lLkJhY2tib25lSW5pdGlhbGl6ZU5vV2FybmluZ3NcbiAgICAgIGRlZmVyLnJlamVjdC5hcHBseSBjb250ZXh0LCBwYXJhbXMuY29uY2F0KHJlc3VsdCBvciBbXSlcbiAgICApXG4gICAgZGVmZXJQcm9taXNlXG5cbiAgYWRkTGlzdGVuZXI6IChzdWJqZWN0LCBldmVudCwgaGFuZGxlciwgY29udGV4dCktPlxuICAgIHN1YmplY3QuX2JiSWQgPSBnZW5JZCgpIHVubGVzcyBzdWJqZWN0Ll9iYklkP1xuICAgIGhhbmRsZXJLZXkgPSBcIiN7c3ViamVjdC5fYmJJZH0tI3tldmVudH1cIlxuICAgIHVubGVzcyBAaGFuZGxlcnNbaGFuZGxlcktleV0/XG4gICAgICBAaGFuZGxlcnNbaGFuZGxlcktleV0gPSBbXVxuICAgICAgQGVudGl0eS5saXN0ZW5UbyBzdWJqZWN0LCBldmVudCwgQGV2ZW50SGFuZGxlcihoYW5kbGVyS2V5KVxuICAgIEBoYW5kbGVyc1toYW5kbGVyS2V5XS5wdXNoIGhhbmRsZXIuYmluZChjb250ZXh0KVxuXG5cbiAgYWRkSGFuZGxlcjogKGV2ZW50cywgaGFuZGxlciwgcGFyZW50ID0gQGVudGl0eSktPlxuICAgIGlmIHR5cGVvZiBldmVudHMgaXMgJ29iamVjdCdcbiAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRzXG4gICAgZWxzZVxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgIGZvciBrZXksIHZhbCBvZiBoYW5kbGVyXG4gICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgYXBwZW5kIGhhbmRsZXJzIHRvICN7ZXZlbnR9IGNhdXNlIGNoaWxkIG5vdCBmb3VuZFwiXG4gICAgICAgIHJldHVyblxuXG4gICAgICBoYW5kbGVyID0gYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXIgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKVxuICAgICAgZXZlbnRzID0gaGFuZGxlci5zaGlmdCgpIGlmIGV2ZW50c1swXSBpcyAnXydcblxuICAgICAgYXJyYXlGcm9tU3RyaW5nKGV2ZW50cykuZm9yRWFjaCAoZXZlbnQpPT5cbiAgICAgICAgZXZlbnRQYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgIGlmIHBhcmVudFBhdGgubGVuZ3RoXG4gICAgICAgICAgcmV0dXJuIHVubGVzcyAoZXZlbnRQYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIGV2ZW50UGFyZW50KSlcblxuICAgICAgICBoYW5kbGVyLmZvckVhY2ggKGhhbmRsZXIpPT5cbiAgICAgICAgICBoYW5kbGVyTmFtZSA9IGZhbHNlXG4gICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBoYW5kbGVyXG4gICAgICAgICAgICBjaGlsZCA9IGhhbmRsZXIuc3BsaXQoJy4nKVxuICAgICAgICAgICAgaGFuZGxlciA9IGNoaWxkLnBvcCgpXG4gICAgICAgICAgICByZXR1cm4gdW5sZXNzIChoYW5kbGVyUGFyZW50ID0gaWYgY2hpbGQubGVuZ3RoIHRoZW4gQGdldENoaWxkKGNoaWxkLCBoYW5kbGVyTmFtZSkgZWxzZSBAZW50aXR5KVxuICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJQYXJlbnRbaGFuZGxlcl1cbiAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICBAYWRkTGlzdGVuZXIgZXZlbnRQYXJlbnQsIGV2ZW50LCBoYW5kbGVyLCBoYW5kbGVyUGFyZW50XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICBhZGRIYW5kbGVyczogLT5cbiAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICBsYXVuY2g6IChpbml0SGFuZGxlcnMsIHBhcmFtcy4uLiktPlxuICAgIEBhZGRIYW5kbGVycygpIGlmIGluaXRIYW5kbGVycz9cbiAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlJFQURZXG4gICAgQGVudGl0eS50cmlnZ2VyICdsYXVuY2gnLCBwYXJhbXMuLi5cblxuICBwcmVwYXJlczogbnVsbFxuXG4gIHByZXBhcmVBbmRMYXVuY2g6IChwYXJhbXMpLT5cbiAgICBAZW50aXR5LmZpcnN0TGF1bmNoID0gQHByZXBhcmVzP1xuXG4gICAgaWYgQmFja2JvbmVQcmVwYXJlLmxlbmd0aCBvciBBcnJheS5pc0FycmF5IEBlbnRpdHkucHJlcGFyZVxuICAgICAgdW5sZXNzIEBwcmVwYXJlcz9cbiAgICAgICAgQGVudGl0eS5wcmVwYXJlIHx8PSBbXVxuICAgICAgICBAZW50aXR5LnByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUuY29uY2F0IEBlbnRpdHkucHJlcGFyZVxuXG4gICAgICAgIEBwcmVwYXJlcyA9IEBlbnRpdHkucHJlcGFyZS5tYXAgKChuYW1lKT0+XG4gICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAZW50aXR5W25hbWVdXG4gICAgICAgICAgdW5sZXNzIHR5cGVvZiBwcmVwYXJlRnVuY3Rpb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgQHdhcm4gXCJQcmVwYXJlIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uXG4gICAgICAgIClcblxuICAgICAgaWYgQHByZXBhcmVzLmxlbmd0aFxuICAgICAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLlBSRVBBUkVcbiAgICAgICAgQGVudGl0eS5wcm9taXNlID0gQGV4ZWN1dGVDaGFpbihAcHJlcGFyZXMsIHBhcmFtcylcbiAgICAgICAgQGVudGl0eS5wcm9taXNlXG4gICAgICAgICAgLmRvbmUoPT5cbiAgICAgICAgICBAbGF1bmNoIEBlbnRpdHkuZmlyc3RMYXVuY2gsIHBhcmFtcy4uLlxuICAgICAgICApXG4gICAgICAgICAgLmZhaWwoPT5cbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJCYWNrYm9uZSBpbml0aWFsaXplIHByZXBhcmVzIGZhaWw6IFwiLCBAcHJlcGFyZXMpICB1bmxlc3MgQmFja2JvbmUuQmFja2JvbmVJbml0aWFsaXplTm9XYXJuaW5nc1xuICAgICAgICAgIEBlbnRpdHkubGF1bmNoU3RhdHVzID0gQmFja2JvbmVMYXVuY2hTdGF0dXMuUFJFUEFSRV9GQUlMXG4gICAgICAgICAgQGVudGl0eS5vbkxhdW5jaEZhaWwgcGFyYW1zLi4uIGlmIHR5cGVvZiBAZW50aXR5Lm9uTGF1bmNoRmFpbCBpcyAnZnVuY3Rpb24nXG4gICAgICAgIClcbiAgICAgICAgcmV0dXJuIEBlbnRpdHkucHJvbWlzZVxuICAgIEBsYXVuY2ggQGVudGl0eS5maXJzdExhdW5jaCwgcGFyYW1zLi4uXG5cbiAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgdW5sZXNzIEBlbnRpdHkubm9CaW5kP1xuICAgICAgZm9yIG5hbWUsIG1ldGhvZCBvZiBAZW50aXR5IHdoZW4gdHlwZW9mIG1ldGhvZCBpcyAnZnVuY3Rpb24nXG4gICAgICAgIEBlbnRpdHlbbmFtZV0gPSBtZXRob2QuYmluZCBAZW50aXR5XG5cbiAgICBAZW50aXR5LmFkZEhhbmRsZXIgPSBAYWRkSGFuZGxlci5iaW5kIEBcbiAgICBAZW50aXR5LmV4ZWN1dGVDaGFpbiA9IEBleGVjdXRlQ2hhaW4uYmluZCBAXG4gICAgQGhhbmRsZXJzID0ge31cbiAgICBAZW50aXR5LmxhdW5jaFN0YXR1cyA9IEJhY2tib25lTGF1bmNoU3RhdHVzLklOSVRcblxuYmFja2JvbmVJbml0aWFsaXplID0gKHBhcmFtcy4uLiktPlxuICBvcHRpb25zID0gQG9wdGlvbnNcbiAgb3B0aW9ucyA9IHBhcmFtc1sxXSB1bmxlc3Mgb3B0aW9ucz9cbiAgQHByZXBhcmUgPSBhcnJheUZyb21TdHJpbmcoQHByZXBhcmUpIGlmIHR5cGVvZiBAcHJlcGFyZSBpcyAnc3RyaW5nJ1xuICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nIG9yIEFycmF5LmlzQXJyYXkoQHByZXBhcmUpXG4gIEBfYmJJbml0aWFsaXplID0gbmV3IEJhY2tib25lSW5pdGlhbGl6ZSBAXG4gIEBhZGRIYW5kbGVyKCdsYXVuY2gnLCBAbGF1bmNoKSBpZiB0eXBlb2YgQGxhdW5jaCBpcyAnZnVuY3Rpb24nXG5cbiAgaWYgb3B0aW9ucz8uYXR0YWNoP1xuICAgIEBbbmFtZV0gPSBvYmplY3QgZm9yIG5hbWUsIG9iamVjdCBvZiBvcHRpb25zLmF0dGFjaFxuXG4gIEByZWxhdW5jaCA9ID0+XG4gICAgQF9iYkluaXRpYWxpemUucHJlcGFyZUFuZExhdW5jaCBwYXJhbXNcbiAgQHJlbGF1bmNoKClcblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTmVzdGVkTW9kZWw/XG4gIEJhY2tib25lLk5lc3RlZE1vZGVsLnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIEJhY2tib25lLkxheW91dD9cbiAgQmFja2JvbmUuTGF5b3V0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIE1hcmlvbmV0dGU/XG4gIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG4iXX0=
