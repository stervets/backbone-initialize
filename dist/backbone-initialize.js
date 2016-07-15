(function() {
  var BackboneInitialize, BackbonePrepare, backboneInitialize,
    slice = [].slice;

  BackboneInitialize = (function() {
    BackboneInitialize.prototype.handlers = null;

    BackboneInitialize.prototype.entity = null;

    BackboneInitialize.prototype.arrayFromString = function(string) {
      if (Array.isArray(string)) {
        return string;
      }
      return string.split(',').map(function(item) {
        return item.trim();
      });
    };

    BackboneInitialize.prototype.warn = function(message) {
      return console.warn("Backbone-initialize warn: " + message);
    };

    BackboneInitialize.prototype.getChild = function(path, event, parent) {
      var child;
      if (parent == null) {
        parent = this.entity;
      }
      child = path.shift();
      if (parent[child] != null) {
        if (path.length) {
          return this.getChild(path, event, parent[child]);
        } else {
          return parent[child];
        }
      } else {
        this.warn(child + " undefined (this." + event + ")");
        return null;
      }
    };

    BackboneInitialize.prototype.addHandler = function(event, handler, parent) {
      var child, key, parentPath, results, results1, val, value;
      if (parent == null) {
        parent = this.entity;
      }
      if (typeof event === 'object') {
        results = [];
        for (key in event) {
          value = event[key];
          results.push(this.addHandler(key, value, parent));
        }
        return results;
      } else {
        if (typeof handler === 'object' && !(Array.isArray(handler))) {
          if ((child = this.getChild(event.split('.'), event, parent))) {
            results1 = [];
            for (key in handler) {
              val = handler[key];
              results1.push(this.addHandler(key, val, child));
            }
            return results1;
          } else {
            return this.warn("Can't append handlers to " + event + " cause child not found");
          }
        } else {
          if (typeof handler === 'string') {
            handler = this.arrayFromString(handler);
          } else {
            if (!Array.isArray(handler)) {
              handler = [handler];
            }
          }
          if (event[0] === '_') {
            event = handler.shift();
          }
          parentPath = event.split('.');
          event = parentPath.pop();
          if (parentPath.length) {
            if (!(parent = this.getChild(parentPath, parentPath.join('.'), parent))) {
              return;
            }
          }
          return handler.forEach((function(_this) {
            return function(handler) {
              var handlerName, handlerParent;
              handlerName = false;
              handlerParent = _this.entity;
              if (typeof handler === 'string') {
                handlerName = handler;
                child = handler.split('.');
                handler = child.pop();
                if (!(handlerParent = child.length ? _this.getChild(child, handlerName) : _this.entity)) {
                  return;
                }
                handler = handlerParent[handler];
              }
              if (typeof handler === 'function') {
                return _this.entity.listenTo(parent, event, handler.bind(handlerParent));
              } else {
                return _this.warn(("Can't find handler for \"" + event + "\"") + (handlerName ? ": \"" + handlerName + "\"" : ''));
              }
            };
          })(this));
        }
      }
    };

    BackboneInitialize.prototype.addHandlers = function() {
      if ((this.entity.handlers != null) && !this.entity.disableHandlers) {
        return this.addHandler(this.entity.handlers);
      }
    };

    BackboneInitialize.prototype.launch = function() {
      var params, ref;
      params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.addHandlers();
      return (ref = this.entity).trigger.apply(ref, ['launch'].concat(slice.call(params)));
    };

    function BackboneInitialize(entity) {
      this.entity = entity;
      this.entity.addHandler = this.addHandler.bind(this);
      this.handlers = {};
    }

    return BackboneInitialize;

  })();

  this.BackbonePrepare = BackbonePrepare = [];

  backboneInitialize = function() {
    var name, object, options, params, prepare, ref, ref1;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    options = this.options;
    if (this instanceof Backbone.Collection) {
      options = params[1];
    }
    if (!(typeof this.handlers === 'object' || ((options != null ? options.attach : void 0) != null) || typeof this.launch === 'function')) {
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
    if (BackbonePrepare.length || Array.isArray(this.prepare)) {
      this.prepare || (this.prepare = []);
      this.prepare = BackbonePrepare.concat(this.prepare);
      prepare = this.prepare.map(((function(_this) {
        return function(name) {
          var prepareFunction;
          prepareFunction = typeof name === 'function' ? name : _this[name];
          if (typeof prepareFunction !== 'function') {
            _this._bbInitialize.warn("Prepare item " + name + " isn't function");
            prepareFunction = $.noop;
          }
          return prepareFunction.apply(_this, params);
        };
      })(this)));
      return $.when.apply(null, prepare).then((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this._bbInitialize).launch.apply(ref1, params);
        };
      })(this));
    } else {
      return (ref1 = this._bbInitialize).launch.apply(ref1, params);
    }
  };

  Backbone.Model.prototype.initialize = backboneInitialize;

  Backbone.Collection.prototype.initialize = backboneInitialize;

  Backbone.View.prototype.initialize = backboneInitialize;

  if (Backbone.Layout != null) {
    Backbone.Layout.prototype.initialize = backboneInitialize;
  }

  if (typeof Marionette !== "undefined" && Marionette !== null) {
    Marionette.Object.prototype.initialize = backboneInitialize;
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1REFBQTtJQUFBOztFQUFNO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixlQUFBLEdBQWlCLFNBQUMsTUFBRDtNQUNiLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGVBQU8sT0FBUDs7YUFDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7ZUFBUyxJQUFJLENBQUMsSUFBTCxDQUFBO01BQVQsQ0FBdEI7SUFGYTs7aUNBSWpCLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsTUFBZDtBQUNOLFVBQUE7O1FBRG9CLFNBQVMsSUFBQyxDQUFBOztNQUM5QixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNSLElBQUcscUJBQUg7UUFDVyxJQUFHLElBQUksQ0FBQyxNQUFSO2lCQUFvQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFBdUIsTUFBTyxDQUFBLEtBQUEsQ0FBOUIsRUFBcEI7U0FBQSxNQUFBO2lCQUErRCxNQUFPLENBQUEsS0FBQSxFQUF0RTtTQURYO09BQUEsTUFBQTtRQUdJLElBQUMsQ0FBQSxJQUFELENBQVMsS0FBRCxHQUFPLG1CQUFQLEdBQTBCLEtBQTFCLEdBQWdDLEdBQXhDO0FBQ0EsZUFBTyxLQUpYOztJQUZNOztpQ0FRVixVQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsT0FBUixFQUFpQixNQUFqQjtBQUNSLFVBQUE7O1FBRHlCLFNBQVMsSUFBQyxDQUFBOztNQUNuQyxJQUFHLE9BQU8sS0FBUCxLQUFnQixRQUFuQjtBQUNJ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UyxDQUFDLFVBQXhCLEdBQXFDOztFQUVyQyxJQUFHLHVCQUFIO0lBQ0ksUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBMUIsR0FBdUMsbUJBRDNDOzs7RUFHQSxJQUFHLHdEQUFIO0lBQ0ksVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBNUIsR0FBeUMsbUJBRDdDOztBQXRHQSIsImZpbGUiOiJiYWNrYm9uZS1pbml0aWFsaXplLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gICAgaGFuZGxlcnM6IG51bGxcbiAgICBlbnRpdHk6IG51bGxcblxuICAgIGFycmF5RnJvbVN0cmluZzogKHN0cmluZyktPlxuICAgICAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgICAgIHN0cmluZy5zcGxpdCgnLCcpLm1hcCAoaXRlbSktPiBpdGVtLnRyaW0oKVxuXG4gICAgd2FybjogKG1lc3NhZ2UpLT5cbiAgICAgICAgY29uc29sZS53YXJuIFwiQmFja2JvbmUtaW5pdGlhbGl6ZSB3YXJuOiAje21lc3NhZ2V9XCJcblxuICAgIGdldENoaWxkOiAocGF0aCwgZXZlbnQsIHBhcmVudCA9IEBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgYWRkSGFuZGxlcjogKGV2ZW50LCBoYW5kbGVyLCBwYXJlbnQgPSBAZW50aXR5KS0+XG4gICAgICAgIGlmIHR5cGVvZiBldmVudCBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgQGFkZEhhbmRsZXIoa2V5LCB2YWx1ZSwgcGFyZW50KSBmb3Iga2V5LCB2YWx1ZSBvZiBldmVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnb2JqZWN0JyBhbmQgIShBcnJheS5pc0FycmF5KGhhbmRsZXIpKVxuICAgICAgICAgICAgICAgIGlmIChjaGlsZCA9IEBnZXRDaGlsZCBldmVudC5zcGxpdCgnLicpLCBldmVudCwgcGFyZW50KVxuICAgICAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWwgb2YgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgQGFkZEhhbmRsZXIga2V5LCB2YWwsIGNoaWxkXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAd2FybiBcIkNhbid0IGFwcGVuZCBoYW5kbGVycyB0byAje2V2ZW50fSBjYXVzZSBjaGlsZCBub3QgZm91bmRcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBAYXJyYXlGcm9tU3RyaW5nIGhhbmRsZXJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl0gdW5sZXNzIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBoYW5kbGVyLnNoaWZ0KCkgaWYgZXZlbnRbMF0gaXMgJ18nXG4gICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICBldmVudCA9IHBhcmVudFBhdGgucG9wKClcbiAgICAgICAgICAgICAgICBpZiBwYXJlbnRQYXRoLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChwYXJlbnQgPSBAZ2V0Q2hpbGQocGFyZW50UGF0aCwgcGFyZW50UGF0aC5qb2luKCcuJyksIHBhcmVudCkpXG5cbiAgICAgICAgICAgICAgICBoYW5kbGVyLmZvckVhY2ggKGhhbmRsZXIpPT5cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyUGFyZW50ID0gQGVudGl0eVxuICAgICAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGhhbmRsZXIuc3BsaXQoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGNoaWxkLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5sZXNzIChoYW5kbGVyUGFyZW50ID0gaWYgY2hpbGQubGVuZ3RoIHRoZW4gQGdldENoaWxkKGNoaWxkLCBoYW5kbGVyTmFtZSkgZWxzZSBAZW50aXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGhhbmRsZXJQYXJlbnRbaGFuZGxlcl1cbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGVudGl0eS5saXN0ZW5UbyBwYXJlbnQsIGV2ZW50LCBoYW5kbGVyLmJpbmQoaGFuZGxlclBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBmaW5kIGhhbmRsZXIgZm9yIFxcXCIje2V2ZW50fVxcXCJcIiArIChpZiBoYW5kbGVyTmFtZSB0aGVuIFwiOiBcXFwiI3toYW5kbGVyTmFtZX1cXFwiXCIgZWxzZSAnJylcblxuICAgIGFkZEhhbmRsZXJzOiAtPlxuICAgICAgICBAYWRkSGFuZGxlciBAZW50aXR5LmhhbmRsZXJzIGlmIEBlbnRpdHkuaGFuZGxlcnM/IGFuZCAhQGVudGl0eS5kaXNhYmxlSGFuZGxlcnNcblxuICAgIGxhdW5jaDogKHBhcmFtcy4uLiktPlxuICAgICAgICBAYWRkSGFuZGxlcnMoKVxuICAgICAgICBAZW50aXR5LnRyaWdnZXIgJ2xhdW5jaCcsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIEBlbnRpdHkuYWRkSGFuZGxlciA9IEBhZGRIYW5kbGVyLmJpbmQgQFxuICAgICAgICBAaGFuZGxlcnMgPSB7fVxuXG5cbkBCYWNrYm9uZVByZXBhcmUgPSBCYWNrYm9uZVByZXBhcmUgPSBbXVxuXG5iYWNrYm9uZUluaXRpYWxpemUgPSAocGFyYW1zLi4uKS0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHBhcmFtc1sxXSBpZiBAIGluc3RhbmNlb2YgQmFja2JvbmUuQ29sbGVjdGlvblxuICAgIHJldHVybiB1bmxlc3MgdHlwZW9mIEBoYW5kbGVycyBpcyAnb2JqZWN0JyBvciBvcHRpb25zPy5hdHRhY2g/IG9yIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcbiAgICBAX2JiSW5pdGlhbGl6ZSA9IG5ldyBCYWNrYm9uZUluaXRpYWxpemUgQFxuXG4gICAgQGFkZEhhbmRsZXIoJ2xhdW5jaCcsIEBsYXVuY2gpIGlmIHR5cGVvZiBAbGF1bmNoIGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBpZiBCYWNrYm9uZVByZXBhcmUubGVuZ3RoIG9yIEFycmF5LmlzQXJyYXkgQHByZXBhcmVcbiAgICAgICAgQHByZXBhcmUgfHw9IFtdXG4gICAgICAgIEBwcmVwYXJlID0gQmFja2JvbmVQcmVwYXJlLmNvbmNhdCBAcHJlcGFyZVxuICAgICAgICBwcmVwYXJlID0gQHByZXBhcmUubWFwICgobmFtZSk9PlxuICAgICAgICAgICAgcHJlcGFyZUZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAW25hbWVdXG4gICAgICAgICAgICB1bmxlc3MgdHlwZW9mIHByZXBhcmVGdW5jdGlvbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgQF9iYkluaXRpYWxpemUud2FybiBcIlByZXBhcmUgaXRlbSAje25hbWV9IGlzbid0IGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgICBwcmVwYXJlRnVuY3Rpb24uYXBwbHkgQCwgcGFyYW1zXG4gICAgICAgIClcbiAgICAgICAgJC53aGVuLmFwcGx5KG51bGwsIHByZXBhcmUpLnRoZW4gPT5cbiAgICAgICAgICAgIEBfYmJJbml0aWFsaXplLmxhdW5jaCBwYXJhbXMuLi5cbiAgICBlbHNlXG4gICAgICAgIEBfYmJJbml0aWFsaXplLmxhdW5jaCBwYXJhbXMuLi5cblxuQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcbkJhY2tib25lLlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuaWYgQmFja2JvbmUuTGF5b3V0P1xuICAgIEJhY2tib25lLkxheW91dC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBNYXJpb25ldHRlP1xuICAgIE1hcmlvbmV0dGUuT2JqZWN0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbiJdfQ==
