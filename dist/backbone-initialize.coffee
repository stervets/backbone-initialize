KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
KEY_LENGTH = KEYS.length;
@BackbonePrepare = BackbonePrepare = []

@BackboneLaunchStatus =
    INIT: 0x0
    PREPARE: 0x1
    PREPARE_FAIL: 0x2
    READY: 0x4


arrayFromString = (string)->
    return string if Array.isArray string
    string.split(',').map (item)-> item.trim()

genId = (length = 16, id = '')->
    while (length-- > 0)
        id += KEYS.charAt(Math.floor(Math.random() * KEY_LENGTH))
        id += '-' unless !length or length % 4
    id

Backbone.BackboneInitializeNoWarnings = false

class BackboneInitialize
    handlers: null
    entity: null

    warn: (message)->
        console.warn( "Backbone-initialize warn: #{message}") unless Backbone.BackboneInitializeNoWarnings

    getChild: (path, event, parent = @entity)->
        child = path.shift()
        if parent[child]?
            return if path.length then @getChild(path, event, parent[child]) else parent[child]
        else
            @warn "#{child} undefined (this.#{event})"
            return null

    eventHandler: (handlerKey)->
        handlers = @handlers[handlerKey]
        (params...)=>
            @executeChain handlers, params

    executeChain: (chain, params, context = @entity, defer, result)->
        params = params or []
        unless defer?
            defer = $.Deferred()
            chain = chain.slice()
            deferPromise = defer.promise()
            deferPromise.defer = defer

        promise = chain.shift()

        $.when(promise.apply(context, params.concat(result or [])))
        .done((result...)=>
            if chain.length
                @executeChain chain, params, context, defer, result
            else
                defer.resolve.apply context, params.concat(result or [])
        )
        .fail((result...)->
            console.warn("Deferred chain fail", promise)  unless Backbone.BackboneInitializeNoWarnings
            defer.reject.apply context, params.concat(result or [])
        )
        deferPromise

    addListener: (subject, event, handler, context)->
        subject._bbId = genId() unless subject._bbId?
        handlerKey = "#{subject._bbId}-#{event}"
        unless @handlers[handlerKey]?
            @handlers[handlerKey] = []
            @entity.listenTo subject, event, @eventHandler(handlerKey)
        @handlers[handlerKey].push handler.bind(context)


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
                        @addListener eventParent, event, handler, handlerParent
                    else
                        @warn "Can't find handler for \"#{event}\"" + (if handlerName then ": \"#{handlerName}\"" else '')

    addHandlers: ->
        @addHandler @entity.handlers if @entity.handlers? and !@entity.disableHandlers

    launch: (initHandlers, params...)->
        @addHandlers() if initHandlers?
        @entity.launchStatus = BackboneLaunchStatus.READY
        @entity.trigger 'launch', params...

    prepares: null

    prepareAndLaunch: (params)->
        @entity.firstLaunch = @prepares?

        if BackbonePrepare.length or Array.isArray @entity.prepare
            unless @prepares?
                @entity.prepare ||= []
                @entity.prepare = BackbonePrepare.concat @entity.prepare

                @prepares = @entity.prepare.map ((name)=>
                    prepareFunction = if typeof name is 'function' then name else @entity[name]
                    unless typeof prepareFunction is 'function'
                        @warn "Prepare item #{name} isn't function"
                        prepareFunction = $.noop;
                    prepareFunction
                )

            if @prepares.length
                @entity.launchStatus = BackboneLaunchStatus.PREPARE
                @entity.promise = @executeChain(@prepares, params)
                @entity.promise
                .done(=>
                    @launch @entity.firstLaunch, params...
                )
                .fail(=>
                    console.warn("Backbone initialize prepares fail: ", @prepares)  unless Backbone.BackboneInitializeNoWarnings
                    @entity.launchStatus = BackboneLaunchStatus.PREPARE_FAIL
                    @entity.onLaunchFail params... if typeof @entity.onLaunchFail is 'function'
                )
                return @entity.promise
        @launch @entity.firstLaunch, params...

    constructor: (@entity)->
        unless @entity.noBind?
            for name, method of @entity when typeof method is 'function'
                @entity[name] = method.bind @entity

        @entity.addHandler = @addHandler.bind @
        @entity.executeChain = @executeChain.bind @
        @handlers = {}
        @entity.launchStatus = BackboneLaunchStatus.INIT

backboneInitialize = (params...)->
    options = @options
    options = params[1] unless options?
    @prepare = arrayFromString(@prepare) if typeof @prepare is 'string'
    return unless typeof @handlers is 'object' or options?.attach? or typeof @launch is 'function' or Array.isArray(@prepare)
    @_bbInitialize = new BackboneInitialize @
    @addHandler('launch', @launch) if typeof @launch is 'function'

    if options?.attach?
        @[name] = object for name, object of options.attach

    @relaunch = =>
        @_bbInitialize.prepareAndLaunch params
    @relaunch()

Backbone.Model.prototype.initialize = backboneInitialize
Backbone.Collection.prototype.initialize = backboneInitialize
Backbone.View.prototype.initialize = backboneInitialize

if Backbone.NestedModel?
    Backbone.NestedModel.prototype.initialize = backboneInitialize

if Backbone.Layout?
    Backbone.Layout.prototype.initialize = backboneInitialize

if Marionette?
    Marionette.Object.prototype.initialize = backboneInitialize

