language = 'en'

TRANSLATION =
    en:
        todoList: 'To do list'
        deleteItem: 'Delete item'
        item: 'Item'
        addItem: 'Add item'
        changeLanguage: 'Change language'
    de:
        todoList: 'Aufgabenliste'
        deleteItem: 'Element löschen'
        item: 'Artikel'
        addItem: 'Artikel hinzufügen'
        changeLanguage: 'Sprache ändern'

###
    To-do item model
###
class TodoItem extends Backbone.Model
    defaults:
        title: ''
        checked: ''

    translationImport: ['item']

    onLanguageChanged: ->
        @set 'title', "#{@translation.item} ##{@cid}"

    ready: ->

###
    To-do collection
###
class TodoCollection extends Backbone.Collection
    model: TodoItem


###
    To-do item view
###
class TodoItemView extends Marionette.ItemView
    template: '#jsTodoItemView'
    ui:
        checkbox: '.jsCheckbox'
        deleteButton: '.jsDeleteItem'

    translationImport: ['deleteItem']

    events:
        'click @ui.deleteButton': 'deleteItem'
        'click @ui.jsCheckbox': 'onCheckboxClick'
        'click': 'onItemClick'

    handlers:
        'model.change': 'render'

    onCheckboxClick: -> false

    deleteItem: ->
        @remove()

    onItemClick: ->
        @model.set('checked', if @model.get('checked') is 'checked' then '' else 'checked')


###
    To-do collection view
###
class TodoCollectionView extends Marionette.CompositeView
    template: '#jsTodoCollectionView',
    childView: TodoItemView,
    childViewContainer: '.jsTodoListContainer'

    translationImport: ['todoList', 'addItem', 'changeLanguage']

    ui:
        addItem: '.jsAddItem'
        changeLanguage: '.jsChangeLanguage'

    events:
        'click @ui.addItem': 'onAddItemClick'
        'click @ui.changeLanguage': 'onChangeLanguageClick'

    handlers:
        'application.changeLanguage': 'render'

    onAddItemClick: ->
        @collection.add {}

    onChangeLanguageClick: ->
        language = if language is 'en' then 'de' else 'en'
        @collection.trigger 'changeLanguage', language
        @application.trigger 'changeLanguage', language


    bootstrap: [
        'initCollection'
    ]

    initCollection: ->


###
    Application layout
###
class ApplicationLayout extends Marionette.LayoutView
    el: 'body',
    regions:
        todoList: '.jsTodoList'

    bootstrap: [
        'initializeTodoList'
    ]

    initializeTodoList: ->
        @getRegion('todoList').show(
            new TodoCollectionView
                attach:
                    application: @
                    collection: @todo
        )


###
    To-do application
###
class Application extends Marionette.Application
    layout: null
    ready: ->
        @layout = new ApplicationLayout
            attach:
                application: @
                todo: @todo

###
    "changeLanguage" event handler
###
setTranslations = (lang)->
    @translation = {}
    @translationImport.forEach (name)=>
        @translation[name] = TRANSLATION[lang][name]
    @trigger 'languageChanged', lang

###
    Global babkbone initialize bootstrap function
###
SetTranslations = ->
    return unless Array.isArray @translationImport

    @addHandler (if @application? then 'application.changeLanguage' else
        (if @collection then 'collection.changeLanguage' else 'model.collection.changeLanguage')), setTranslations

    if typeof @onLanguageChanged is 'function'
        @addHandler 'languageChanged', 'onLanguageChanged'

    setTranslations.call @, language
    @templateHelpers = => @translation

BackboneBootstrap.push SetTranslations


# init
$ ->
    todo = new TodoCollection(new Array(10))
    new Application
        attach:
            todo: todo