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

    launch: ->

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

    deleteItem: ->
        @model.destroy()

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

    onAddItemClick: ->
        @collection.add {}

    onChangeLanguageClick: ->
        language = if language is 'en' then 'de' else 'en'
        @collection.trigger 'changeLanguage', language
        @application.trigger 'changeLanguage', language


###
    Application layout
###
class ApplicationLayout extends Marionette.LayoutView
    el: 'body',
    regions:
        todoList: '.jsTodoList'

    prepare: [
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
    launch: ->
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
    Global backbone initialize prepare function
###
SetTranslations = ->
    return unless Array.isArray @translationImport

    @addHandler (if @application? then 'application.changeLanguage' else
        (if @collection then 'collection.changeLanguage' else 'model.collection.changeLanguage')), setTranslations

    if typeof @onLanguageChanged is 'function'
        @addHandler 'languageChanged', 'onLanguageChanged'

    setTranslations.call @, language
    @templateHelpers = => @translation

BackbonePrepare.push SetTranslations


# init
$ ->
    todo = new TodoCollection(new Array(10))
    new Application
        attach:
            todo: todo