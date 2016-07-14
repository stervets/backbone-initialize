(function() {
  var BackboneBootstrap, BackboneInitialize, backboneInitialize,
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

    BackboneInitialize.prototype.ready = function() {
      var params, ref;
      params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.addHandlers();
      return (ref = this.entity).trigger.apply(ref, ['ready'].concat(slice.call(params)));
    };

    function BackboneInitialize(entity) {
      this.entity = entity;
      this.entity.addHandler = this.addHandler.bind(this);
      this.handlers = {};
    }

    return BackboneInitialize;

  })();

  this.BackboneBootstrap = BackboneBootstrap = [];

  backboneInitialize = function() {
    var bootstrap, name, object, options, params, ref, ref1;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    options = this.options;
    if (this instanceof Backbone.Collection) {
      options = params[1];
    }
    if (!(typeof this.handlers === 'object' || ((options != null ? options.attach : void 0) != null) || typeof this.ready === 'function')) {
      return;
    }
    this._bbInitialize = new BackboneInitialize(this);
    if (typeof this.ready === 'function') {
      this.addHandler('ready', this.ready);
    }
    if ((options != null ? options.attach : void 0) != null) {
      ref = options.attach;
      for (name in ref) {
        object = ref[name];
        this[name] = object;
      }
    }
    if (BackboneBootstrap.length || Array.isArray(this.bootstrap)) {
      this.bootstrap || (this.bootstrap = []);
      this.bootstrap = BackboneBootstrap.concat(this.bootstrap);
      bootstrap = this.bootstrap.map(((function(_this) {
        return function(name) {
          var bootstrapFunction;
          bootstrapFunction = typeof name === 'function' ? name : _this[name];
          if (typeof bootstrapFunction !== 'function') {
            _this._bbInitialize.warn("Bootstrap item " + name + " isn't function");
            bootstrapFunction = $.noop;
          }
          return bootstrapFunction.apply(_this, params);
        };
      })(this)));
      return $.when.apply(null, bootstrap).then((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this._bbInitialize).ready.apply(ref1, params);
        };
      })(this));
    } else {
      return (ref1 = this._bbInitialize).ready.apply(ref1, params);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhY2tib25lLWluaXRpYWxpemUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5REFBQTtJQUFBOztFQUFNO2lDQUNGLFFBQUEsR0FBVTs7aUNBQ1YsTUFBQSxHQUFROztpQ0FFUixlQUFBLEdBQWlCLFNBQUMsTUFBRDtNQUNiLElBQWlCLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUFqQjtBQUFBLGVBQU8sT0FBUDs7YUFDQSxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFzQixTQUFDLElBQUQ7ZUFBUSxJQUFJLENBQUMsSUFBTCxDQUFBO01BQVIsQ0FBdEI7SUFGYTs7aUNBSWpCLElBQUEsR0FBTSxTQUFDLE9BQUQ7YUFDRixPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLE9BQTFDO0lBREU7O2lDQUdOLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsTUFBZDtBQUNOLFVBQUE7O1FBRG9CLFNBQU8sSUFBQyxDQUFBOztNQUM1QixLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBQTtNQUNSLElBQUcscUJBQUg7UUFDVyxJQUFHLElBQUksQ0FBQyxNQUFSO2lCQUFvQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFBdUIsTUFBTyxDQUFBLEtBQUEsQ0FBOUIsRUFBcEI7U0FBQSxNQUFBO2lCQUErRCxNQUFPLENBQUEsS0FBQSxFQUF0RTtTQURYO09BQUEsTUFBQTtRQUdJLElBQUMsQ0FBQSxJQUFELENBQVMsS0FBRCxHQUFPLG1CQUFQLEdBQTBCLEtBQTFCLEdBQWdDLEdBQXhDO0FBQ0EsZUFBTyxLQUpYOztJQUZNOztpQ0FRVixVQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsT0FBUixFQUFpQixNQUFqQjtBQUNSLFVBQUE7O1FBRHlCLFNBQU8sSUFBQyxDQUFBOztNQUNqQyxJQUFHLE9BQU8sS0FBUCxLQUFnQixRQUFuQjtBQUNJ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QUFJLENBQUMsU0FBUyxDQUFDLFVBQXhCLEdBQXFDOztFQUVyQyxJQUFHLHVCQUFIO0lBQ0ksUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBMUIsR0FBdUMsbUJBRDNDOzs7RUFHQSxJQUFHLHdEQUFIO0lBQ0ksVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBNUIsR0FBeUMsbUJBRDdDOztBQXRHQSIsImZpbGUiOiJiYWNrYm9uZS1pbml0aWFsaXplLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQmFja2JvbmVJbml0aWFsaXplXG4gICAgaGFuZGxlcnM6IG51bGxcbiAgICBlbnRpdHk6IG51bGxcblxuICAgIGFycmF5RnJvbVN0cmluZzogKHN0cmluZyktPlxuICAgICAgICByZXR1cm4gc3RyaW5nIGlmIEFycmF5LmlzQXJyYXkgc3RyaW5nXG4gICAgICAgIHN0cmluZy5zcGxpdCgnLCcpLm1hcCAoaXRlbSktPml0ZW0udHJpbSgpXG5cbiAgICB3YXJuOiAobWVzc2FnZSktPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJCYWNrYm9uZS1pbml0aWFsaXplIHdhcm46ICN7bWVzc2FnZX1cIlxuXG4gICAgZ2V0Q2hpbGQ6IChwYXRoLCBldmVudCwgcGFyZW50PUBlbnRpdHkpLT5cbiAgICAgICAgY2hpbGQgPSBwYXRoLnNoaWZ0KClcbiAgICAgICAgaWYgcGFyZW50W2NoaWxkXT9cbiAgICAgICAgICAgIHJldHVybiBpZiBwYXRoLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChwYXRoLCBldmVudCwgcGFyZW50W2NoaWxkXSkgZWxzZSBwYXJlbnRbY2hpbGRdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3YXJuIFwiI3tjaGlsZH0gdW5kZWZpbmVkICh0aGlzLiN7ZXZlbnR9KVwiXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgYWRkSGFuZGxlcjogKGV2ZW50LCBoYW5kbGVyLCBwYXJlbnQ9QGVudGl0eSktPlxuICAgICAgICBpZiB0eXBlb2YgZXZlbnQgaXMgJ29iamVjdCdcbiAgICAgICAgICAgIEBhZGRIYW5kbGVyKGtleSwgdmFsdWUsIHBhcmVudCkgZm9yIGtleSwgdmFsdWUgb2YgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ29iamVjdCcgYW5kICEoQXJyYXkuaXNBcnJheShoYW5kbGVyKSlcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgPSBAZ2V0Q2hpbGQgZXZlbnQuc3BsaXQoJy4nKSwgZXZlbnQsIHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgZm9yIGtleSwgdmFsIG9mIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRIYW5kbGVyIGtleSwgdmFsLCBjaGlsZFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHdhcm4gXCJDYW4ndCBhcHBlbmQgaGFuZGxlcnMgdG8gI3tldmVudH0gY2F1c2UgY2hpbGQgbm90IGZvdW5kXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gQGFycmF5RnJvbVN0cmluZyBoYW5kbGVyXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gW2hhbmRsZXJdIHVubGVzcyBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgICAgICBldmVudCA9IGhhbmRsZXIuc2hpZnQoKSBpZiBldmVudFswXSBpcyAnXydcblxuICAgICAgICAgICAgICAgIHBhcmVudFBhdGggPSBldmVudC5zcGxpdCgnLicpXG4gICAgICAgICAgICAgICAgZXZlbnQgPSBwYXJlbnRQYXRoLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgcGFyZW50UGF0aC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAocGFyZW50ID0gQGdldENoaWxkKHBhcmVudFBhdGgsIHBhcmVudFBhdGguam9pbignLicpLCBwYXJlbnQpKVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlci5mb3JFYWNoIChoYW5kbGVyKT0+XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlclBhcmVudCA9IEBlbnRpdHlcbiAgICAgICAgICAgICAgICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBoYW5kbGVyLnNwbGl0KCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBjaGlsZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVubGVzcyAoaGFuZGxlclBhcmVudCA9IGlmIGNoaWxkLmxlbmd0aCB0aGVuIEBnZXRDaGlsZChjaGlsZCwgaGFuZGxlck5hbWUpIGVsc2UgQGVudGl0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyUGFyZW50W2hhbmRsZXJdXG4gICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIEBlbnRpdHkubGlzdGVuVG8gcGFyZW50LCBldmVudCwgaGFuZGxlci5iaW5kKGhhbmRsZXJQYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YXJuIFwiQ2FuJ3QgZmluZCBoYW5kbGVyIGZvciBcXFwiI3tldmVudH1cXFwiXCIrKGlmIGhhbmRsZXJOYW1lIHRoZW4gXCI6IFxcXCIje2hhbmRsZXJOYW1lfVxcXCJcIiBlbHNlICcnKVxuXG4gICAgYWRkSGFuZGxlcnM6IC0+XG4gICAgICAgIEBhZGRIYW5kbGVyIEBlbnRpdHkuaGFuZGxlcnMgaWYgQGVudGl0eS5oYW5kbGVycz8gYW5kICFAZW50aXR5LmRpc2FibGVIYW5kbGVyc1xuXG4gICAgcmVhZHk6IChwYXJhbXMuLi4pLT5cbiAgICAgICAgQGFkZEhhbmRsZXJzKClcbiAgICAgICAgQGVudGl0eS50cmlnZ2VyICdyZWFkeScsIHBhcmFtcy4uLlxuXG4gICAgY29uc3RydWN0b3I6IChAZW50aXR5KS0+XG4gICAgICAgIEBlbnRpdHkuYWRkSGFuZGxlciA9IEBhZGRIYW5kbGVyLmJpbmQgQFxuICAgICAgICBAaGFuZGxlcnMgPSB7fVxuXG5cbkBCYWNrYm9uZUJvb3RzdHJhcCA9IEJhY2tib25lQm9vdHN0cmFwID0gW11cblxuYmFja2JvbmVJbml0aWFsaXplID0gKHBhcmFtcy4uLiktPlxuICAgIG9wdGlvbnMgPSBAb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBwYXJhbXNbMV0gaWYgQCBpbnN0YW5jZW9mIEJhY2tib25lLkNvbGxlY3Rpb25cbiAgICByZXR1cm4gdW5sZXNzIHR5cGVvZiBAaGFuZGxlcnMgaXMgJ29iamVjdCcgb3Igb3B0aW9ucz8uYXR0YWNoPyBvciB0eXBlb2YgQHJlYWR5IGlzICdmdW5jdGlvbidcbiAgICBAX2JiSW5pdGlhbGl6ZSA9IG5ldyBCYWNrYm9uZUluaXRpYWxpemUgQFxuXG4gICAgQGFkZEhhbmRsZXIoJ3JlYWR5JywgQHJlYWR5KSBpZiB0eXBlb2YgQHJlYWR5IGlzICdmdW5jdGlvbidcblxuICAgIGlmIG9wdGlvbnM/LmF0dGFjaD9cbiAgICAgICAgQFtuYW1lXSA9IG9iamVjdCBmb3IgbmFtZSwgb2JqZWN0IG9mIG9wdGlvbnMuYXR0YWNoXG5cbiAgICBpZiBCYWNrYm9uZUJvb3RzdHJhcC5sZW5ndGggb3IgQXJyYXkuaXNBcnJheSBAYm9vdHN0cmFwXG4gICAgICAgIEBib290c3RyYXAgfHw9IFtdXG4gICAgICAgIEBib290c3RyYXAgPSBCYWNrYm9uZUJvb3RzdHJhcC5jb25jYXQgQGJvb3RzdHJhcFxuICAgICAgICBib290c3RyYXAgPSBAYm9vdHN0cmFwLm1hcCAoKG5hbWUpPT5cbiAgICAgICAgICAgIGJvb3RzdHJhcEZ1bmN0aW9uID0gaWYgdHlwZW9mIG5hbWUgaXMgJ2Z1bmN0aW9uJyB0aGVuIG5hbWUgZWxzZSBAW25hbWVdXG4gICAgICAgICAgICB1bmxlc3MgdHlwZW9mIGJvb3RzdHJhcEZ1bmN0aW9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICBAX2JiSW5pdGlhbGl6ZS53YXJuIFwiQm9vdHN0cmFwIGl0ZW0gI3tuYW1lfSBpc24ndCBmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgYm9vdHN0cmFwRnVuY3Rpb24gPSAkLm5vb3A7XG4gICAgICAgICAgICBib290c3RyYXBGdW5jdGlvbi5hcHBseSBALCBwYXJhbXNcbiAgICAgICAgKVxuICAgICAgICAkLndoZW4uYXBwbHkobnVsbCwgYm9vdHN0cmFwKS50aGVuID0+XG4gICAgICAgICAgICBAX2JiSW5pdGlhbGl6ZS5yZWFkeSBwYXJhbXMuLi5cbiAgICBlbHNlXG4gICAgICAgIEBfYmJJbml0aWFsaXplLnJlYWR5IHBhcmFtcy4uLlxuXG5CYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuQmFja2JvbmUuVmlldy5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGJhY2tib25lSW5pdGlhbGl6ZVxuXG5pZiBCYWNrYm9uZS5MYXlvdXQ/XG4gICAgQmFja2JvbmUuTGF5b3V0LnByb3RvdHlwZS5pbml0aWFsaXplID0gYmFja2JvbmVJbml0aWFsaXplXG5cbmlmIE1hcmlvbmV0dGU/XG4gICAgTWFyaW9uZXR0ZS5PYmplY3QucHJvdG90eXBlLmluaXRpYWxpemUgPSBiYWNrYm9uZUluaXRpYWxpemVcblxuIl19
