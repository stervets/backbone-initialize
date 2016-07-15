class BackboneInitialize
    handlers: null
    entity: null

    arrayFromString: (string)->
        return string if Array.isArray string
        string.split(',').map (item)-> item.trim()

    warn: (message)->
        console.warn "Backbone-initialize warn: #{message}"

    getChild: (path, event, parent = @entity)->
        child = path.shift()
        if parent[child]?
            return if path.length then @getChild(path, event, parent[child]) else parent[child]
        else
            @warn "#{child} undefined (this.#{event})"
            return null

    addHandler: (event, handler, parent = @entity)->
        if typeof event is 'object'
            @addHandler(key, value, parent) for key, value of event
        else
            if typeof handler is 'object' and !(Array.isArray(handler))
                if (child = @getChild event.split('.'), event, parent)
                    for key, val of handler
                        @addHandler key, val, child
                else
                    @warn "Can't append handlers to #{event} cause child not found"
            else
                if typeof handler is 'string'
                    handler = @arrayFromString handler
                else
                    handler = [handler] unless Array.isArray handler

                event = handler.shift() if event[0] is '_'
                parentPath = event.split('.')
                event = parentPath.pop()
                if parentPath.length
                    return unless (parent = @getChild(parentPath, parentPath.join('.'), parent))

                handler.forEach (handler)=>
                    handlerName = false
                    handlerParent = @entity
                    if typeof handler is 'string'
                        handlerName = handler
                        child = handler.split('.')
                        handler = child.pop()
                        return unless (handlerParent = if child.length then @getChild(child, handlerName) else @entity)
                        handler = handlerParent[handler]
                    if typeof handler is 'function'
                        @entity.listenTo parent, event, handler.bind(handlerParent)
                    else
                        @warn "Can't find handler for \"#{event}\"" + (if handlerName then ": \"#{handlerName}\"" else '')

    addHandlers: ->
        @addHandler @entity.handlers if @entity.handlers? and !@entity.disableHandlers

    launch: (params...)->
        @addHandlers()
        @entity.trigger 'launch', params...

    constructor: (@entity)->
        @entity.addHandler = @addHandler.bind @
        @handlers = {}


@BackbonePrepare = BackbonePrepare = []

backboneInitialize = (params...)->
    options = @options
    options = params[1] if @ instanceof Backbone.Collection
    return unless typeof @handlers is 'object' or options?.attach? or typeof @launch is 'function'
    @_bbInitialize = new BackboneInitialize @

    @addHandler('launch', @launch) if typeof @launch is 'function'

    if options?.attach?
        @[name] = object for name, object of options.attach

    if BackbonePrepare.length or Array.isArray @prepare
        @prepare ||= []
        @prepare = BackbonePrepare.concat @prepare
        prepare = @prepare.map ((name)=>
            prepareFunction = if typeof name is 'function' then name else @[name]
            unless typeof prepareFunction is 'function'
                @_bbInitialize.warn "Prepare item #{name} isn't function"
                prepareFunction = $.noop;
            prepareFunction.apply @, params
        )
        $.when.apply(null, prepare).then =>
            @_bbInitialize.launch params...
    else
        @_bbInitialize.launch params...

Backbone.Model.prototype.initialize = backboneInitialize
Backbone.Collection.prototype.initialize = backboneInitialize
Backbone.View.prototype.initialize = backboneInitialize

if Backbone.Layout?
    Backbone.Layout.prototype.initialize = backboneInitialize

if Marionette?
    Marionette.Object.prototype.initialize = backboneInitialize

