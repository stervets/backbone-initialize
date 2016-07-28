arrayFromString = (string)->
    return string if Array.isArray string
    string.split(',').map (item)-> item.trim()

class BackboneInitialize
    handlers: null
    entity: null

    warn: (message)->
        console.warn "Backbone-initialize warn: #{message}"

    getChild: (path, event, parent = @entity)->
        child = path.shift()
        if parent[child]?
            return if path.length then @getChild(path, event, parent[child]) else parent[child]
        else
            @warn "#{child} undefined (this.#{event})"
            return null

    addHandler: (events, handler, parent = @entity)->
        if typeof events is 'object'
            @addHandler(key, value, parent) for key, value of events
        else
            if typeof handler is 'object' and !(Array.isArray(handler))
                arrayFromString(events).forEach (event)=>
                    if (child = @getChild event.split('.'), event, parent)
                        for key, val of handler
                            @addHandler key, val, child
                    else
                        @warn "Can't append handlers to #{event} cause child not found"
                return

            handler = arrayFromString handler if typeof handler is 'string'
            handler = [handler] unless Array.isArray handler
            handler = handler.slice()
            events = handler.shift() if events[0] is '_'

            arrayFromString(events).forEach (event)=>
                eventParent = parent
                parentPath = event.split('.')
                event = parentPath.pop()
                if parentPath.length
                    return unless (eventParent = @getChild(parentPath, parentPath.join('.'), eventParent))

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
                        @entity.listenTo eventParent, event, handler.bind(handlerParent)
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

executeDeferredChain = (prepare, params, context, defer)->
    promise = prepare.shift()
    $.when(promise.apply(context, params)).then ->
            if prepare.length
                executeDeferredChain prepare, params, context, defer
            else
                defer.resolve()


backboneInitialize = (params...)->
    options = @options
    options = params[1] unless options?
    @prepare = arrayFromString(@prepare) if typeof @prepare is 'string'
    return unless typeof @handlers is 'object' or options?.attach? or typeof @launch is 'function' or Array.isArray(@prepare)
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
            prepareFunction
        )

        defer = $.Deferred()
        defer.then =>
            @_bbInitialize.launch params...
        executeDeferredChain prepare, params, @, defer
        @promise = defer.promise()
    else
        @_bbInitialize.launch params...

Backbone.Model.prototype.initialize = backboneInitialize
Backbone.Collection.prototype.initialize = backboneInitialize
Backbone.View.prototype.initialize = backboneInitialize

if Backbone.NestedModel?
    Backbone.NestedModel.prototype.initialize = backboneInitialize

if Backbone.Layout?
    Backbone.Layout.prototype.initialize = backboneInitialize

if Marionette?
    Marionette.Object.prototype.initialize = backboneInitialize

